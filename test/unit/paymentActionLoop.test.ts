import _ from 'lodash';
import Crypto from 'crypto';
import { paymentActionLoop, dividePointsByType } from '../../src/utils/points';
import { Point, pointConverter } from '../../src/classes/Point';
import { pay, sortByFTxnDate, print, calc, reset, amount } from '../../src/callbacks';

jest.setTimeout(10000);

const getSecureRandomValue = () => {
  const buff = Crypto.randomBytes(8); // バイナリで8byteのランダムな値を生成
  const hex = buff.toString('hex'); // 16進数の文字列に変換
  return parseInt(hex, 16); // integerに変換して返却
};

describe('paymentActionLoop関数', () => {
  describe('期間限定ポイントの配列に対して', () => {
    let points: Point[] = [];
    beforeEach(() => {
      /**
       * Arrange
       */
      //最終取引日が現時点より前のものと現時点より後のものを用意する
      /**
       * 合計2620ポイントの残高
       * 通常ポイント数: 1370
       *  内訳
       *    100 2020/11/01
       *    200 2020/11/02
       *    120 2020/11/05
       *    350 2021/06/04
       *    350 2021/06/04
       *    250 2021/11/04
       *  限定ポイント数: 1250
       *   内訳
       *    300 2020/11/03
       *    150 2020/11/04
       *    250 2020/11/04
       *    550 2021/06/03
       */
      points = [
        new Point(100, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(200, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(300, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(150, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(250, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(250, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(120, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(550, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(350, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(350, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
      ];

      points[0].fTxnDate = new Date('2020/11/1 12:00');
      points[1].fTxnDate = new Date('2020/11/2 12:00');
      points[2].fTxnDate = new Date('2020/11/3 18:00');
      points[3].fTxnDate = new Date('2020/11/4 12:00');
      points[4].fTxnDate = new Date('2021/11/4 12:01');
      points[5].fTxnDate = new Date('2020/11/4 12:01');
      points[6].fTxnDate = new Date('2020/11/5 12:10');
      points[7].fTxnDate = new Date('2021/6/3 18:15');
      points[8].fTxnDate = new Date('2021/6/4 12:00');
      points[9].fTxnDate = new Date('2021/6/4 12:15');
    });

    it('0ポイント使用しようとしたとき、spentGrossAmountは0になる', () => {
      const dividedPointsObj = dividePointsByType(points);
      let limitedGetPoints = dividedPointsObj.limitedGetPoints;
      let result = paymentActionLoop(dividedPointsObj.limitedGetPoints, 0);
      limitedGetPoints = result.points;
      print(limitedGetPoints);
      expect(result.spentGrossAmount).toBe(0);
    });

    it('550ポイント使用しようとしたとき、spentGrossAmountは550になる', () => {
      const dividedPointsObj = dividePointsByType(points);
      let limitedGetPoints = dividedPointsObj.limitedGetPoints;
      let result = paymentActionLoop(dividedPointsObj.limitedGetPoints, 550);
      limitedGetPoints = result.points;
      print(limitedGetPoints);
      expect(result.spentGrossAmount).toBe(550);
    });

    it('550ポイント使用しようとしたとき、feeは0になる', () => {
      const dividedPointsObj = dividePointsByType(points);
      let limitedGetPoints = dividedPointsObj.limitedGetPoints;
      let result = paymentActionLoop(dividedPointsObj.limitedGetPoints, 550);
      limitedGetPoints = result.points;
      print(limitedGetPoints);
      expect(result.fee).toBe(0);
    });

    it('1250ポイント使用しようとしたとき、spentGrossAmountは1250になる', () => {
      const dividedPointsObj = dividePointsByType(points);
      let limitedGetPoints = dividedPointsObj.limitedGetPoints;
      let result = paymentActionLoop(dividedPointsObj.limitedGetPoints, 1250);
      limitedGetPoints = result.points;
      print(limitedGetPoints);
      expect(result.spentGrossAmount).toBe(1250);
    });

    it('1251ポイント使用しようとしたとき、spentGrossAmountは1250になる', () => {
      const dividedPointsObj = dividePointsByType(points);
      let limitedGetPoints = dividedPointsObj.limitedGetPoints;
      let result = paymentActionLoop(dividedPointsObj.limitedGetPoints, 1251);
      limitedGetPoints = result.points;
      print(limitedGetPoints);
      expect(result.spentGrossAmount).toBe(1250);
    });

    it('1251ポイント使用しようとしたとき、はみ出るためfeeは1になる', () => {
      const dividedPointsObj = dividePointsByType(points);
      let limitedGetPoints = dividedPointsObj.limitedGetPoints;
      let result = paymentActionLoop(dividedPointsObj.limitedGetPoints, 1251);
      limitedGetPoints = result.points;
      print(limitedGetPoints);
      expect(result.fee).toBe(1);
    });
  });

  describe('日付分けしたUSEタイプのドキュメントが存在する通常ポイントの配列に対して', () => {
    let points: Point[] = [];
    beforeEach(() => {
      /**
       * Arrange
       */
      //最終取引日が現時点より前のものと現時点より後のものを用意する
      /**
       * 合計2620ポイントの残高
       * 通常ポイント数: 1370
       * 計算後ポイント数: 1120
       *  内訳
       *    100 => 0 2020/11/01
       *    200 => 50 2020/11/02
       *    120 2020/11/05
       *    350 2021/06/04
       *    350 2021/06/04
       *    250 2021/11/04
       *  限定ポイント数: 1250
       *   内訳
       *    300 2020/11/03
       *    150 2020/11/04
       *    250 2020/11/04
       *    550 2021/06/03
       */
      points = [
        new Point(100, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(200, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(300, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(150, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(250, 'THE STAY SAPPORO', 'NORMAL', 'USE'),
        new Point(250, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(120, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(550, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(350, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(350, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
      ];

      points[0].fTxnDate = new Date('2020/11/1 12:00');
      points[1].fTxnDate = new Date('2020/11/2 12:00');
      points[2].fTxnDate = new Date('2020/11/3 18:00');
      points[3].fTxnDate = new Date('2020/11/4 12:00');
      points[4].fTxnDate = new Date('2021/11/4 12:01');
      points[5].fTxnDate = new Date('2020/11/4 12:01');
      points[6].fTxnDate = new Date('2020/11/5 12:10');
      points[7].fTxnDate = new Date('2021/6/3 18:15');
      points[8].fTxnDate = new Date('2021/6/4 12:00');
      points[9].fTxnDate = new Date('2021/6/4 12:15');

      points = calc(points);
    });

    it('0ポイント使用しようとしたとき、spentGrossAmountは0になる', () => {
      /**
       * Arrange
       */
      points = calc(points);
      const dividedPointsObj = dividePointsByType(points);
      let normalGetPoints = dividedPointsObj.normalGetPoints;
      /**
       * Act
       */
      let result = paymentActionLoop(dividedPointsObj.normalGetPoints, 0);
      normalGetPoints = result.points;
      print(normalGetPoints);
      /**
       * Assert
       */
      expect(result.spentGrossAmount).toBe(0);
    });

    it('1121ポイント使用しようとしたとき、spentGrossAmountは1120になる', () => {
      /**
       * Arrange
       */
      points = calc(points);
      const dividedPointsObj = dividePointsByType(points);
      let normalGetPoints = dividedPointsObj.normalGetPoints;
      /**
       * Act
       */
      let result = paymentActionLoop(dividedPointsObj.normalGetPoints, 1121);
      normalGetPoints = result.points;
      print(normalGetPoints);
      /**
       * Assert
       */
      expect(result.spentGrossAmount).toBe(1120);
    });
  });
});
