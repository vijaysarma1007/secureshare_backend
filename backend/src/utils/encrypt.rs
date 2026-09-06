// this file will contain the logic to encrypt th data using aes bulk data encrption and rsa for encrypting the aes key
// this ensures scalable and secure encryption solution

use crate::error::HttpError;
use aes::Aes256;
use cbc;
use cipher::{BlockModeEncrypt, KeyIvInit, block_padding::Pkcs7};
use rand;
use rsa::{Pkcs1v15Encrypt, RsaPublicKey, rand_core::OsRng};

type Aes256CbcEnc = cbc::Encryptor<Aes256>;

pub fn encrypt_file(
    file_data: &[u8],
    user_public_key: &RsaPublicKey,
) -> Result<(Vec<u8>, Vec<u8>, Vec<u8>), HttpError> {
    // 1. Generate 256-bit AES key and 128-bit IV as fixed-size arrays
    let mut aes_key = [0u8; 32];
    //iv -> Initialization Vector
    let mut iv = [0u8; 16]; //iv = [00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00]
    rand::fill(&mut aes_key);
    rand::fill(&mut iv); //iv = [8F, 3A, C1, 99, 4E, B0, 12, FA, 77, CD, E3, 05, 62, BB, 41, 90]

    // 2. Prepare buffer with extra capacity for PKCS7 padding (up to 16 extra bytes)
    let pos = file_data.len();
    let mut buffer = vec![0u8; pos + 16];
    buffer[..pos].copy_from_slice(file_data);

    // 3. Encrypt the file data using AES-256-CBC
    let cipher = Aes256CbcEnc::new(&aes_key.into(), &iv.into());
    let encrypted_data = cipher
        .encrypt_padded::<Pkcs7>(&mut buffer, pos)
        .map_err(|e| HttpError::server_error(e.to_string()))?
        .to_vec();

    // 4. Encrypt the AES key using the user's RSA Public Key
    let mut rng = OsRng;
    let encrypted_aes_key = user_public_key
        .encrypt(&mut rng, Pkcs1v15Encrypt, &aes_key)
        .map_err(|e| HttpError::server_error(e.to_string()))?;

    Ok((encrypted_aes_key, encrypted_data, iv.to_vec()))
}
