/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs';
import iconv from 'iconv-lite';
import Papa from 'papaparse';

import { Point } from '../classes/Point';
import { PrintablePoint } from './mocks';

export const createCSV = (filename: string, data: Point[]) => {
  const dist = `data/csv/${filename}.csv`;

  const csv = Papa.unparse(data);

  fs.writeFileSync(dist, '');
  const fd = fs.openSync(dist, 'w');
  const buf = iconv.encode(csv, 'utf8', {
    addBOM: true,
  });
  fs.write(fd, buf, 0, buf.length, (err, written, buffer) => {
    if (err) {
      console.error(err);
    }
    console.log('成功');
  });
};

export function createHistoryCSV(filename: string, data: PrintablePoint[]) {
  const dist = `data/csv/${filename}.csv`;

  const csv = Papa.unparse(data);

  fs.writeFileSync(dist, '');
  const fd = fs.openSync(dist, 'w');
  const buf = iconv.encode(csv, 'utf8', {
    addBOM: true,
  });
  fs.write(fd, buf, 0, buf.length, (err, written, buffer) => {
    if (err) {
      console.error(err);
    }
    console.log('成功');
  });
}
