import { createHash } from "node:crypto";
import { PathLike, createReadStream } from "node:fs";

type SupportedHash = 'md5' | 'sha1' | 'sha256' | 'sha512';

export async function checksumFile(hashName: SupportedHash, path: PathLike): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash(hashName);
      const stream = createReadStream(path);
      stream.on('error', err => reject(err));
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }