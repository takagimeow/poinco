import _ from 'lodash';

// import { Poinco } from '../src/classes/Poinco';
import { Point } from '../../src/classes/Point';
import { pay, sortByFTxnDate, print, calc, reset, amount } from '../../src/callbacks';
const dt = new Date();

describe('calc関数', () => {
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

  it('[calc関数]USEポイントｗGETポイントの古いレコードでLIMITEなポイントから順に引いてnetAmountが更新されたpointsを返す', () => {
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
    expect(points[2].netAmount).toBe(150);
  });
});
