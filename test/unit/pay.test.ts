import _ from 'lodash';

// import { Poinco } from '../src/classes/Poinco';
import { Point } from '../../src/classes/Point';
import { dividePointsByDate, dividePointsByType, paymentActionLoop } from '../../src/utils/points';
import { getRemainings } from '../../src/utils/payValidator';
import { generatePoints } from '../../src/generatePoints';
import { pay, sortByFTxnDate, print, calc, reset, amount } from '../../src/callbacks';
import { createHistoryCSV } from '../../src/utils/csv';
import { traceDependencies, printHistory } from '../../src/utils/mocks';

const dt = new Date();

describe('pay関数', () => {
  describe('ランダムなポイントの配列に対して', () => {
    let points: Point[] = [];
    beforeEach(() => {
      /**
       * Arrange
       */
      const counterparties = ['THE STAY SAPPORO', 'GRIDS SAPPORO'];
      const date = new Date('2020/01/13 12:00');
      points = generatePoints(50, counterparties, date);
    });

    afterEach(() => {
      points = reset(points);
    });

    it('期間限定ポイントの残額と同じ額の金額を使うと、その金額の期間限定使用ポイントが追加される', () => {
      // console.log(`↓ 現在のpoints[${points.length}]`);
      // print(points);
      const { limitedRemainings } = getRemainings(reset(points));
      // console.log('limitedRemainings: ', limitedRemainings);
      if (limitedRemainings) {
        const payResult = pay(points, limitedRemainings, 'THE STAY SAPPORO');
        // const newPoints = payResult.points;
        const { limitedUsePoint } = payResult;
        // console.log(`↓ 新しいpoints[${newPoints.length}]`);
        // print(newPoints);
        // print([limitedUsePoint as Point]);
        // traceDependencies(reset(newPoints));
        expect(limitedUsePoint?.grossAmount).toBe(limitedRemainings);
      } else {
        throw new Error('期間限定の残額ポイントが存在しないためテストできませんでした');
      }
    });

    it('通常ポイントの残額と同じ額の金額を使うと、その金額の通常使用ポイントが追加される', () => {
      console.log(`↓ 現在のpoints[${points.length}]`);
      print(points);
      const { limitedRemainings, normalRemainings } = getRemainings(reset(points));
      console.log('limitedRemainings: ', limitedRemainings);
      console.log('normalRemainings: ', normalRemainings);
      if (normalRemainings) {
        const payResult = pay(points, limitedRemainings + normalRemainings, 'THE STAY SAPPORO');
        const newPoints = payResult.points;
        const { limitedUsePoint, normalUsePoint } = payResult;
        console.log(`↓ 新しいpoints[${newPoints.length}]`);
        print(newPoints);
        print([normalUsePoint as Point]);
        traceDependencies(reset(newPoints));
        expect(normalUsePoint?.grossAmount).toBe(normalRemainings);
      } else {
        throw new Error('通常の残額ポイントが存在しないためテストできませんでした');
      }
    });
  });

  describe('日付分けしたUSEタイプのドキュメントが存在するポイントの配列に対して', () => {
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
      /**
       * Assert
       */
      expect(result.spentGrossAmount).toBe(0);
    });
  });

  describe('過去のテスト', () => {
    let points: Point[] = [];
    beforeEach(() => {
      /**
       * 合計1350ポイントの残高
       */
      points = [
        new Point(100, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(200, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(300, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(150, 'THE STAY SAPPORO', 'LIMITED', 'GET'),
        new Point(250, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
        new Point(350, 'THE STAY SAPPORO', 'NORMAL', 'GET'),
      ];

      points[0].fTxnDate = new Date('2020/11/1 12:00');
      points[1].fTxnDate = new Date('2020/11/2 12:00');
      points[2].fTxnDate = new Date('2020/11/3 18:00');
      points[3].fTxnDate = new Date('2020/11/3 18:15');
      points[4].fTxnDate = new Date('2020/11/4 12:00');
      points[5].fTxnDate = new Date('2020/11/15 12:15');
    });

    afterEach(() => {
      points = reset(points);
    });

    it('残高不足の場合は実行されない', () => {
      const oldPointsLength = points.length;
      // 残高不足のため実行されない
      let result = pay(points, 1360);
      expect(result.points.length).toBe(oldPointsLength);
    });

    it('残高が足りている場合は実行される', () => {
      const oldPointsLength = points.length;
      // 残高と一致するため実行される
      const result = pay(points, 1350);
      points = result.points;

      // 期間限定1回、期間限定1回+通常1回の計3個分のレコード
      expect(points.length).toBe(oldPointsLength + 2);
    });

    it('支払後特定のレコードの金額が意図した値になる', () => {
      const result = pay(points, 150);
      points = result.points;
      const limitedGetPoints = _.filter(points, (o: Point) => {
        return o.isLimitedType && o.action === 'GET';
      });
      expect(limitedGetPoints[0].netAmount).toBe(150);
    });

    it('一番昔のLIMITEDポイントの300から100と150ポイントがそれぞれ使用されて、通常ポイントは使用されないため追加されるレコードはLIMITEDでUSEのPoint２つである', () => {
      let result = pay(points, 100, 'THE STAY SAPPORO');
      points = reset(result.points);
      points = calc(points);
      result = pay(points, 150, 'THE STAY SAPPORO');
      expect(points.length).toBe(7);
    });

    it('期間限定ポイントを使い切った場合、通常ポイントから差し引く', () => {
      // points[2].netAmount の 300 - 150 = 150
      points.push(new Point(150, 'THE STAY SAPPORO', 'LIMITED', 'USE'));
      points[points.length - 1].fTxnDate = new Date('2020/11/15 12:30');
      /**
       * points[2].netAmount の 150 - 420 = -270
       * points[3].netAmount の 150 - 270 = -120
       * points[0].netAmount の 100 - 120 = -20
       * points[1].netAmount の 200 - 20 = 180
       */

      points = sortByFTxnDate(points);
      points = calc(points);
      pay(points, 420, 'THE STAY SAPPORO');
      expect(points[1].netAmount).toBe(180);
    });
  });
});
