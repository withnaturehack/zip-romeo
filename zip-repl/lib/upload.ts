import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

// Upload an image to the Supabase storage `photos` bucket.
//
// Native (iOS/Android): expo-image-picker returns a file:// URI. Reading
// it via fetch().blob() is unreliable on RN, so we go through
// expo-file-system → base64 → ArrayBuffer.
//
// Web: expo-image-picker returns a blob:/data: URL. fetch().blob() works
// fine there. expo-file-system is native-only so we can't share the
// native path; the platforms diverge cleanly.
export async function pickAndUploadPhoto(userId: string, slot: number): Promise<UploadResult> {
  // On iOS, we request photo library permissions.
  // On Android, we bypass this because we use the permissionless system photo picker
  // and do not declare/request restricted media permissions in the manifest.
  if (Platform.OS === 'ios') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { ok: false, error: 'Photo library access denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.85,
    // Request base64 directly from the picker — more reliable than reading
    // the URI via expo-file-system, which fails on iOS ph:// asset URIs.
    base64: true,
  });
  if (result.canceled || !result.assets[0]) return { ok: false, error: 'Cancelled' };

  const asset = result.assets[0];
  const ext = (asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg').replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
  const contentType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const path = `${userId}/${Date.now()}-${slot}.${ext}`;

  try {
    let body: ArrayBuffer | Blob;

    if (Platform.OS === 'web') {
      // On web, fetch the blob URL — base64 may not be populated here.
      const res = await fetch(asset.uri);
      body = await res.blob();
    } else {
      // Native: use the base64 string ImagePicker already decoded for us.
      // This avoids expo-file-system which can't read ph:// URIs on iOS.
      const b64 = asset.base64;
      if (!b64) return { ok: false, error: 'Could not read photo data — try again' };
      const { decode: decodeBase64 } = require('base64-arraybuffer');
      body = decodeBase64(b64);
    }

    const { error: uploadErr } = await supabase
      .storage
      .from('photos')
      .upload(path, body, { contentType, upsert: true });
    if (uploadErr) return { ok: false, error: uploadErr.message };

    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Upload failed' };
  }
}
