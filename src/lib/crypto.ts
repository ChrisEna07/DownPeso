/**
 * Utilidad de ofuscación y cifrado ligero para almacenamiento local de la API Key en el cliente.
 * Evita almacenar la clave en texto plano legible en localStorage o IndexedDB.
 */

const SALT = 'DownPeso_ChrizDev_Client_Salt_2026_x89';

export function obfuscateKey(rawKey: string): string {
  if (!rawKey) return '';
  try {
    const chars = rawKey.split('');
    const saltChars = SALT.split('');
    const encoded = chars.map((char, index) => {
      const charCode = char.charCodeAt(0);
      const saltCode = saltChars[index % saltChars.length].charCodeAt(0);
      return String.fromCharCode(charCode ^ saltCode);
    }).join('');
    return btoa(unescape(encodeURIComponent(encoded)));
  } catch (err) {
    console.error('Error al ofuscar la clave:', err);
    return rawKey;
  }
}

export function deobfuscateKey(obfuscatedKey: string): string {
  if (!obfuscatedKey) return '';
  try {
    const decoded = decodeURIComponent(escape(atob(obfuscatedKey)));
    const saltChars = SALT.split('');
    return decoded.split('').map((char, index) => {
      const charCode = char.charCodeAt(0);
      const saltCode = saltChars[index % saltChars.length].charCodeAt(0);
      return String.fromCharCode(charCode ^ saltCode);
    }).join('');
  } catch (err) {
    // Si no estaba codificada, retornar tal cual por retrocompatibilidad
    return obfuscatedKey;
  }
}
