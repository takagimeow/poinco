import _ from 'lodash';
import Crypto from 'crypto';
import { generatePointValue, generatePoints, payMock } from '../../src/generatePoints';
import { createCSV } from '../../src/utils/csv';
import { createJSON } from '../../src/utils/json';
import { Point } from '../../src/classes/Point';

jest.setTimeout(10000);

const getSecureRandomValue = () => {
  const buff = Crypto.randomBytes(8); // バイナリで8byteのランダムな値を生成
  const hex = buff.toString('hex'); // 16進数の文字列に変換
  return parseInt(hex, 16); // integerに変換して返却
};

describe('generatePoints関数', () => {
  describe('事前', () => {
    it('配列の個数が0の場合は空の配列を返す', () => {
      /**
       * Arrange
       */
      const date = new Date('2021/01/13 12:00');
      const counterparty = 'THE STAY SAPPORO';
      /**
       * Act
       */
      const points = generatePoints(0, [counterparty], date);
      /**
       * Assert
       */
      expect(points.length).toBe(0);
    });
    it('会社名の配列の個数が0の場合はランダムな会社名を使用したポイントの配列を返す', () => {
      /**
       * Arrange
       */
      const date = new Date('2021/01/13 12:00');
      /**
       * Act
       */
      const points = generatePoints(10, [], date);
      /**
       * Assert
       */
      expect(points[0].counterparty).toBeTruthy();
    });
  });
  describe('ポイント数が生成せれたとき', () => {
    it('生成された値は200の倍数である', () => {
      /**
       * Act
       */
      const pointValue = generatePointValue();
      /**
       * Assert
       */
      expect(pointValue % 200).toBe(0);
    });
  });
  describe('USEポイントの生成時', () => {
    it('LIMITEDが200のみのGETポイントが存在するときLIMITEDが200のUSEポイントが生成される', () => {
      /**
       * Arrange
       */
      const counterparty = 'THE STAY SAPPORO';
      const points = [new Point(200, counterparty, 'LIMITED', 'GET')];
      /**
       * Act
       */
      const result = payMock(points, 200, counterparty);
      /**
       * Assert
       */
      expect(result.limitedUsePoint).toBeTruthy();
      expect(result.limitedUsePoint?.grossAmount).toBe(200);
      expect(result.normalUsePoint).not.toBeTruthy();
    });
    it('NORMALが200のみのGETポイントが存在するときNORMALが200のUSEポイントが生成される', () => {
      /**
       * Arrange
       */
      const counterparty = 'THE STAY SAPPORO';
      const points = [new Point(200, counterparty, 'NORMAL', 'GET')];
      /**
       * Act
       */
      const result = payMock(points, 200, counterparty);
      /**
       * Assert
       */
      expect(result.normalUsePoint).toBeTruthy();
      expect(result.normalUsePoint?.grossAmount).toBe(200);
      expect(result.limitedUsePoint).not.toBeTruthy();
    });
  });
  describe('LIMITEDが200、NORMALが400のGETポイントが存在するとき', () => {
    it('800のポイント数が与えられた場合、800のUSEポイントは生成されない', () => {
      /**
       * Arrange
       */
      const counterparty = 'THE STAY SAPPORO';
      const points = [
        new Point(200, counterparty, 'LIMITED', 'GET'),
        new Point(400, counterparty, 'LIMITED', 'GET'),
      ];
      /**
       * Act
       */
      const result = payMock(points, 800, counterparty);
      /**
       * Assert
       */
      expect(result.normalUsePoint).not.toBeTruthy();
      expect(result.limitedUsePoint).not.toBeTruthy();
    });
    it('600のポイント数が与えられた場合、LIMITED200のUSEポイントとNORMAL400のUSEポイントが生成される', () => {
      /**
       * Arrange
       */
      const counterparty = 'THE STAY SAPPORO';
      const points = [
        new Point(200, counterparty, 'LIMITED', 'GET'),
        new Point(400, counterparty, 'NORMAL', 'GET'),
      ];
      /**
       * Act
       */
      const result = payMock(points, 600, counterparty);
      /**
       * Assert
       */
      expect(result.limitedUsePoint?.grossAmount).toBe(200);
      expect(result.normalUsePoint?.grossAmount).toBe(400);
    });
  });
  describe('ファイルの生成', () => {
    let points: Point[] = [];
    beforeAll(() => {
      /**
       * Arrange
       */
      const counterparties = ['THE STAY SAPPORO', 'GRIDS SAPPORO'];
      const date = new Date('2021/01/13 12:00');
      points = generatePoints(10, counterparties, date);
    });
    it('csvファイルの生成', () => {
      /**
       * Act
       */
      createCSV('points', points);
    });

    it('jsonファイルの生成', () => {
      /**
       * Act
       */
      createCSV('points', points);
    });
  });
});
