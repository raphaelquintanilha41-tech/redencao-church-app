import { supabase } from './supabaseClient';
import type { Profile } from './types';

export async function fetchOwnProfile(userId: string): Promise<Profile | null> {
const { data, error } = await supabase
.from('profiles')
.select('*')
.eq('user_id', userId)
.maybeSingle();

if (error) throw error;
return data as Profile | null;
}

export async function updateOwnProfile(
userId: string,
patch: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>,
): Promise<Profile> {
const { data, error } = await supabase
.from('profiles')
.update(patch)
.eq('user_id', userId)
.select()
.single();

if (error) throw error;
return data as Profile;
}

/**
* Downscales/compresses the image client-side (max 512px square, JPEG ~0.85
* quality) before upload, then uploads to the "avatars" bucket at
* "<user_id>/avatar.jpg" — the path convention the storage RLS policies in
* the migration require ((storage.foldername(name))[1] = auth.uid()::text).
* Returns the public URL to persist onto profiles.avatar_url.
*/
export async function uploadAvatar(userId: string, file: File): Promise<string> {
const blob = await compressImageToSquareJpeg(file, 512, 0.85);
const path = `${userId}/avatar.jpg`;

const { error: uploadError } = await supabase.storage
.from('avatars')
.upload(path, blob, { contentType: 'image/jpeg', upsert: true });

if (uploadError) throw uploadError;

const { data } = supabase.storage.from('avatars').getPublicUrl(path);
// Cache-bust so the new avatar shows immediately even though the path is stable.
return `${data.publicUrl}?v=${Date.now()}`;
}

function compressImageToSquareJpeg(file: File, size: number, quality: number): Promise<Blob> {
return new Promise((resolve, reject) => {
const img = new Image();
const objectUrl = URL.createObjectURL(file);
img.onload = () => {
URL.revokeObjectURL(objectUrl);
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d');
if (!ctx) {
reject(new Error('Canvas 2D context indisponível.'));
return;
}
// Center-crop to a square, then scale to `size`.
const minSide = Math.min(img.width, img.height);
const sx = (img.width - minSide) / 2;
const sy = (img.height - minSide) / 2;
ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
canvas.toBlob(
(blob) => {
if (!blob) {
reject(new Error('Falha ao comprimir a imagem.'));
return;
}
resolve(blob);
},
'image/jpeg',
quality,
);
};
img.onerror = () => {
URL.revokeObjectURL(objectUrl);
reject(new Error('Não foi possível carregar a imagem selecionada.'));
};
img.src = objectUrl;
});
}
