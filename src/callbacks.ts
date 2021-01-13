/* eslint-disable no-underscore-dangle */
import { printTable } from 'console-table-printer';
import _ from 'lodash';

import { Point } from './classes/Point';
import { dateConverter } from './utils/date';
import { dividePointsByDate, dividePointsByType, paymentActionLoop } from './utils/points';
/**
 * お客さんが取得可能なポイント数を見積もる
 * @param billingAmount お客さんが支払う金額
 * @param interestRate 利率
 */
export const estimate = (billingAmount: number, interestRate: number) => {
  if (interestRate > 0) {
    return Math.floor(interestRate * billingAmount);
  }
  return 0;
};

/**
 * fTxnDate.secondsに基づいてソーティングを行う
 * fTxnDateはポイントの反映日を表します
 */
export const sortByFTxnDate = (points: Point[] = []) => {
  const sortedPoints = _.sortBy(points, [
    (o: Point) => {
      const seconds = o.fTxnDate.getTime();
      return seconds;
    },
  ]);
  return sortedPoints;
};

/**
 * fTxnDate に基づいてソーティングを行い、昇順から降順にするためリバースをする。
 * @param points Point型の配列
 */
export const reverse = (points: Point[] = []) => {
  const sortedPoints = sortByFTxnDate(points);
  return _.reverse(sortedPoints);
};

/**
 * 履歴を確認したいときにテーブルにしてコンソールに表示する
 * @param ps Point型の配列
 */
export const print = (points: Point[] = []) => {
  const parsedPoints: {
    [key: string]: string;
  }[] = [];
  const sortedPoints = points.length === 0 ? sortByFTxnDate() : sortByFTxnDate(points);
  sortedPoints.forEach((p: Point) =>
    parsedPoints.push({
      date: dateConverter(p.fTxnDate),
      // action: p.action === 'GET' ? '獲得' : '利用',
      action: p.action,
      // isLimitedType: p.isLimitedType ? '期間限定' : '通常',
      isLimitedType: p.isLimitedType ? 'LIMITED' : 'NORMAL',
      price: `${p.netAmount} / ${p.grossAmount}`,
    }),
  );
  printTable(parsedPoints);
};

/**
 * 引数であるpointsのnetAmountプロパティを基に期間限定ポイント、通常ポイント、その総額ポイント数を計算する
 * 必ずcalc関数を実行してからamountを呼び出すこと。なぜならnetAmountが計算されずにgrossAmountプロパティと同じ値のままのPointが存在する可能性があるから。
 * @param points Point型の配列
 */
export const amount = (points: Point[] = []) => {
  let limitedPointsAmount = 0;
  let normalPointsAmount = 0;

  limitedPointsAmount = _.sumBy(
    _.filter(points, (o: Point) => {
      if (o.action === 'GET' && o.isLimitedType) {
        return true;
      }
      return false;
    }),
    'netAmount',
  );
  normalPointsAmount = _.sumBy(
    _.filter(points, (o: Point) => {
      if (o.action === 'GET' && !o.isLimitedType) {
        return true;
      }
      return false;
    }),
    'netAmount',
  );
  return {
    limitedPointsAmount,
    normalPointsAmount,
    amount: limitedPointsAmount + normalPointsAmount,
  };
};

/**
 * ポイントを残高から使う際に呼び出す
 * @param points Point型の配列
 * @param fee 使用するポイント数
 * @param counterparty 取引先企業名
 */
export const pay = (points: Point[], fee: number, counterparty: string = '-') => {
  const today = new Date();

  const { confirmedPoints, notConfirmedPoints } = dividePointsByDate(points, today);
  const amountResult = amount(confirmedPoints);
  const confirmedAmount = amountResult.amount;
  if (fee > 0 && confirmedAmount >= fee) {
    const sortedPoints = sortByFTxnDate(confirmedPoints);
    let tmpFee = fee;
    let limitedFee = 0;
    let normalFee = 0;
    let {
      limitedGetPoints,
      limitedUsePoints,
      normalGetPoints,
      normalUsePoints,
    } = dividePointsByType(sortedPoints);

    let paymentActionLoopResult = paymentActionLoop(limitedGetPoints, tmpFee);
    tmpFee = paymentActionLoopResult.fee;
    limitedFee = fee - tmpFee;
    limitedGetPoints = paymentActionLoopResult.points;

    paymentActionLoopResult = paymentActionLoop(normalGetPoints, tmpFee);
    tmpFee = paymentActionLoopResult.fee;
    normalGetPoints = paymentActionLoopResult.points;
    normalFee = fee - limitedFee;

    const newPoints = [
      ...normalGetPoints,
      ...limitedGetPoints,
      ...normalUsePoints,
      ...limitedUsePoints,
      ...notConfirmedPoints,
    ];

    let newLimitedUsePoint: Point | null = null;
    let newNormalUsePoint: Point | null = null;

    if (limitedFee > 0) {
      newLimitedUsePoint = new Point(limitedFee, counterparty, 'LIMITED', 'USE');
      newPoints.push(newLimitedUsePoint);
    }
    if (normalFee > 0) {
      newNormalUsePoint = new Point(normalFee, counterparty, 'NORMAL', 'USE');
      newPoints.push(newNormalUsePoint);
    }

    return {
      points: sortByFTxnDate(newPoints),
      limitedUsePoint: newLimitedUsePoint,
      normalUsePoint: newNormalUsePoint,
    };
  }

  return {
    points,
    limitedUsePoint: null,
    normalUsePoint: null,
  };
};

/**
 * calc 関数から呼び出される
 */
export const applyUsePoint = (points: Point[], usePoint: Point) => {
  const fee = usePoint.grossAmount;
  const confirmedPoints = _.filter(points, (o: Point) => {
    return o.fTxnDate.getTime() <= usePoint.fTxnDate.getTime();
  });
  const amountResult = amount(confirmedPoints);
  const confirmedAmount = amountResult.amount;
  if (fee > 0 && confirmedAmount >= fee) {
    const sortedPoints = sortByFTxnDate(confirmedPoints);
    let tmpFee = fee;
    let { limitedGetPoints, normalGetPoints } = dividePointsByType(sortedPoints);

    let paymentActionLoopResult = paymentActionLoop(limitedGetPoints, tmpFee);
    tmpFee = paymentActionLoopResult.fee;
    limitedGetPoints = paymentActionLoopResult.points;

    paymentActionLoopResult = paymentActionLoop(normalGetPoints, tmpFee);
    tmpFee = paymentActionLoopResult.fee;
    normalGetPoints = paymentActionLoopResult.points;

    const newPoints = [
      ...normalGetPoints,
      ...limitedGetPoints,
      ..._.filter(points, (o: Point) => {
        return o.fTxnDate.getTime() > usePoint.fTxnDate.getTime();
      }),
    ];

    // pointsを日付順にソーティングする（昇順）
    return sortByFTxnDate(newPoints);
  }

  return points;
};

export const calc = (points: Point[]) => {
  const sortedPoints = sortByFTxnDate(points);
  const {
    limitedGetPoints,
    limitedUsePoints,
    normalGetPoints,
    normalUsePoints,
  } = dividePointsByType(sortedPoints);

  // 反映日順に使用したポイントのレコードが配列にまとめられる
  const usePoints = sortByFTxnDate([...limitedUsePoints, ...normalUsePoints]);
  let getPoints = sortByFTxnDate([...limitedGetPoints, ...normalGetPoints]);

  usePoints.forEach((point: Point) => {
    getPoints = applyUsePoint(getPoints, point);
  });
  return sortByFTxnDate([...getPoints, ...usePoints]);
};

/**
 * netAmountの値をgrossAmountの値に戻す。
 * これは新規取引が発生した場合などに、ポイント使用の再計算を行う際に使われる。
 * @param ps Point型の配列
 */
export const reset = (points: Point[]) => {
  return points.map((point) => {
    const newPoint = point;
    newPoint.netAmount = point.grossAmount;
    return newPoint;
  });
};
