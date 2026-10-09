async function setPb(score = 999999) {
  const fileKey =
    "/idbfs/4340b309dc5d1c6bb7a15d695b7a3551/PlayerPrefs";

  if (!Number.isInteger(score) || score < 0) {
    throw new Error("Score must be a non-negative integer.");
  }

  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open("/idbfs");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const file = await new Promise((resolve, reject) => {
    const tx = database.transaction("FILE_DATA", "readonly");
    const request = tx.objectStore("FILE_DATA").get(fileKey);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (!file?.contents) {
    throw new Error("PlayerPrefs file not found.");
  }

  const bytes = file.contents;
  const marker = [4, 66, 101, 115, 116, 254];
  let pos = -1;

  for (let i = 0; i <= bytes.length - marker.length - 4; i++) {
    if (marker.every((b, j) => bytes[i + j] === b)) {
      pos = i + marker.length;
      break;
    }
  }

  if (pos < 0) {
    throw new Error("Could not locate the Best field.");
  }

  new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).setInt32(pos, score, true);

  await new Promise((resolve, reject) => {
    const tx = database.transaction("FILE_DATA", "readwrite");
    tx.objectStore("FILE_DATA").put(file, fileKey);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });

  console.log(`Saved PlayerPrefs Best = ${score}`);
  database.close();
}
