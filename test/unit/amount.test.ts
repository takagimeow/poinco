import _ from 'lodash';

// import { Poinco } from '../src/classes/Poinco';
import { Point } from '../../src/classes/Point';
import { dividePointsByDate } from '../../src/utils/points';
import { pay, sortByFTxnDate, print, calc, reset, amount } from '../../src/callbacks';
const dt = new Date();

describe('amount関数', () => {
  let points: Point[] = [];

  describe('dividePointsByDate関数で分けたポイントを渡す場合', () => {
    beforeEach(() => {
      /**
       * Arrang                                                                                                                                                e
       */
      //最終取引日が現時点より前のものと現時点より後のものを用意する
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
      points[3].fTxnDate = new Date('2021/6/3 18:15');
      points[4].fTxnDate = new Date('2021/6/4 12:00');
      points[5].fTxnDate = new Date('2021/6/4 12:15');
    });

    afterEach(() => {
      points = reset(points);
    });
    it('確定済みポイントのみの[獲得]通常ポイントは300', () => {
      const today = new Date();
      const { confirmedPoints, notConfirmedPoints } = dividePointsByDate(points, today);
      expect(amount(confirmedPoints).normalPointsAmount).toBe(300);
    });
    it('確定済みポイントのみの[獲得]期間限定ポイントは450', () => {
      const today = new Date();
      const { confirmedPoints, notConfirmedPoints } = dividePointsByDate(points, today);
      // 期間限定1回、期間限定1回+通常1回の計3個分のレコード
      expect(amount(confirmedPoints).limitedPointsAmount).toBe(300);
    });

    it('確定済み[使用]通常ポイントがある場合の[獲得]通常ポイントは300', () => {
      points.splice(3, 0, new Point(300, 'THE STAY SAPPORO', 'NORMAL', 'USE'));
      points[4].fTxnDate = new Date('2020/11/4 18:00');
      const today = new Date();
      const { confirmedPoints, notConfirmedPoints } = dividePointsByDate(points, today);
      expect(amount(confirmedPoints).normalPointsAmount).toBe(300);
    });
  });
});
