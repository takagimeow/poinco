/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs';
import iconv from 'iconv-lite';
import Papa from 'papaparse';

import { Point } from '../classes/Point';

export const createJSON = (filename: string, data: Point[]) => {
  const dist = `data/json/${filename}.json`;

  const json = JSON.stringify(data);

  fs.writeFileSync(dist, '');
  const fd = fs.openSync(dist, 'w');
  const buf = iconv.encode(json, 'utf8', {
    addBOM: true,
  });
  fs.write(fd, buf, 0, buf.length, (err, written, buffer) => {
    if (err) {
      console.error(err);
    }
    console.log('成功');
  });
};
