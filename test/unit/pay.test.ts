import _ from 'lodash';

// import { Poinco } from '../src/classes/Poinco';
import { Point } from '../../src/classes/Point';
import { pay, sortByFTxnDate, print, calc, reset, amount } from '../../src/callbacks';
const dt = new Date();

describe('pay関数', () => {
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
    print(result.points);
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
