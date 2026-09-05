use crate::error::HttpError;
use aes::Aes256;
use cbc::cipher::{block_padding::Pkcs7, KeyIvInit};
use cipher::BlockModeDecrypt;
use rsa::{Pkcs1v15Encrypt, RsaPrivateKey};

type Aes256CbcDec = cbc::Decryptor<Aes256>;

pub fn decrypt_file(
    encrypted_aes_key: &[u8],
    encrypted_data: &[u8],
    iv: &[u8],
    user_private_key: &RsaPrivateKey,
) -> Result<Vec<u8>, HttpError> {
    // 1. Decrypt the 32-byte AES key using the user's RSA Private Key
    let aes_key = user_private_key
        .decrypt(Pkcs1v15Encrypt, encrypted_aes_key)
        .map_err(|e| HttpError::server_error(format!("RSA decryption failed: {e}")))?;

    // Validate key and IV lengths before passing to the cipher
    if aes_key.len() != 32 {
        return Err(HttpError::server_error("Invalid decrypted AES key length"));
    }
    if iv.len() != 16 {
        return Err(HttpError::server_error("Invalid IV length"));
    }

    // 2. Prepare a mutable buffer for in-place AES decryption
    let mut buffer = encrypted_data.to_vec();

    // 3. Decrypt the ciphertext and unpad PKCS7 bytes
    let cipher = Aes256CbcDec::new_from_slices(&aes_key, iv)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    let decrypted_data = cipher
        .decrypt_padded::<Pkcs7>(&mut buffer)
        .map_err(|e| HttpError::server_error(format!("AES decryption/padding error: {e}")))?;

    Ok(decrypted_data.to_vec())
}