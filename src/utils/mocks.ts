import _ from 'lodash';

import { sortByFTxnDate, applyUsePoint, print } from '../callbacks';
import { Point } from '../classes/Point';
import { dateConverter } from './date';
import { dividePointsByDate, dividePointsByType, paymentActionLoop } from './points';

export interface AppliedHistoryItem {
  point: Point;
  pointValue: number;
}

export interface PointWithHistory {
  point: Point;
  history: Point[];
}

export interface PrintablePoint {
  id: string;
  date: string;
  action: '親' | '子';
  type: string;
  price: string; // 親なら netAmount / grossAmount。子なら netAmount のみ
}

export function paymentActionLoopMock(points: Point[], fee = 0) {
  const history: AppliedHistoryItem[] = [];

  if (fee <= 0)
    return {
      points,
      history,
      spentGrossAmount: 0,
      fee,
    };
  let tmpFee = fee;
  let grossAmount = 0;
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    // 履歴に登録
    history.push({
      point,
      pointValue: fee,
    });
    // 計算を行う
    const paymentActionResult = point.paymentAction(tmpFee);
    // 入れ替える
    // limitedGetPoints[i] = point;
    tmpFee = paymentActionResult.remainder;
    grossAmount += point.grossAmount - point.netAmount;
    // 今回の計算だけで終了させるか問う
    if (paymentActionResult.isEnough) {
      break;
    }
  }

  return {
    points,
    history,
    spentGrossAmount: grossAmount,
    fee: tmpFee,
  };
}

export function calcMock(points: Point[]) {
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
}

export function traceDependencies(points: Point[]) {
  const sortedPoints = sortByFTxnDate(points);
  const {
    limitedGetPoints,
    limitedUsePoints,
    normalGetPoints,
    normalUsePoints,
  } = dividePointsByType(sortedPoints);

  let history: {
    date: number;
    log: string;
  }[] = [];

  for (let i = 0; i < limitedUsePoints.length; i += 1) {
    const limitedUsePoint = limitedUsePoints[i];
    for (let j = 0; j < limitedGetPoints.length; j += 1) {
      const limitedGetPoint = limitedGetPoints[j];
      if (limitedUsePoint.netAmount === 0) break;
      if (limitedGetPoint.netAmount > 0) {
        if (limitedGetPoint.netAmount > limitedUsePoint.netAmount) {
          const difference = limitedGetPoint.netAmount - limitedUsePoint.netAmount;
          history.push({
            date: limitedGetPoint.fTxnDate.getTime(),
            log: `限定[${dateConverter(limitedGetPoint.fTxnDate)}]のレコードの残高[${
              limitedGetPoint.netAmount
            }/${limitedGetPoint.grossAmount}]から[${dateConverter(
              limitedUsePoint.fTxnDate,
            )}]のレコードの残高[${limitedUsePoint.netAmount}/${
              limitedUsePoint.grossAmount
            }]を引きました。[${dateConverter(
              limitedGetPoint.fTxnDate,
            )}]のレコードの残高は[${difference}/${limitedGetPoint.grossAmount}]です。`,
          });
          limitedGetPoint.netAmount = difference;
          limitedUsePoint.netAmount = 0;
          limitedGetPoints[j] = limitedGetPoint;
          limitedUsePoints[i] = limitedUsePoint;
          break;
        } else {
          const difference = limitedUsePoint.netAmount - limitedGetPoint.netAmount;
          history.push({
            date: limitedGetPoint.fTxnDate.getTime(),
            log: `限定[${dateConverter(limitedGetPoint.fTxnDate)}]のレコードの残高[${
              limitedGetPoint.netAmount
            }/${limitedGetPoint.grossAmount}]から[${dateConverter(
              limitedUsePoint.fTxnDate,
            )}]のレコードの残高[${limitedUsePoint.netAmount}/${
              limitedUsePoint.grossAmount
            }]を引きました。[${dateConverter(limitedGetPoint.fTxnDate)}]のレコードの残高は[${0}/${
              limitedGetPoint.grossAmount
            }]です。`,
          });
          limitedGetPoint.netAmount = 0;
          limitedUsePoint.netAmount = difference;
          limitedGetPoints[j] = limitedGetPoint;
          limitedUsePoints[i] = limitedUsePoint;
        }
      }
    }
  }

  for (let i = 0; i < normalUsePoints.length; i += 1) {
    const normalUsePoint = normalUsePoints[i];
    for (let j = 0; j < normalGetPoints.length; j += 1) {
      const normalGetPoint = normalGetPoints[j];
      if (normalUsePoint.netAmount === 0) break;
      if (normalGetPoint.netAmount > 0) {
        if (normalGetPoint.netAmount > normalUsePoint.netAmount) {
          const difference = normalGetPoint.netAmount - normalUsePoint.netAmount;
          history.push({
            date: normalUsePoint.fTxnDate.getTime(),
            log: `通常[${dateConverter(normalGetPoint.fTxnDate)}]のレコードの残高[${
              normalGetPoint.netAmount
            }/${normalGetPoint.grossAmount}]から[${dateConverter(
              normalUsePoint.fTxnDate,
            )}]のレコードの残高[${normalUsePoint.netAmount}/${
              normalUsePoint.grossAmount
            }]を引きました。[${dateConverter(
              normalGetPoint.fTxnDate,
            )}]のレコードの残高は[${difference}/${normalGetPoint.grossAmount}]です。`,
          });
          normalGetPoint.netAmount = difference;
          normalUsePoint.netAmount = 0;
          normalGetPoints[j] = normalGetPoint;
          normalUsePoints[i] = normalUsePoint;
          break;
        } else {
          const difference = normalUsePoint.netAmount - normalGetPoint.netAmount;
          history.push({
            date: normalUsePoint.fTxnDate.getTime(),
            log: `通常[${dateConverter(normalGetPoint.fTxnDate)}]のレコードの残高[${
              normalGetPoint.netAmount
            }/${normalGetPoint.grossAmount}]から[${dateConverter(
              normalUsePoint.fTxnDate,
            )}]のレコードの残高[${normalUsePoint.netAmount}/${
              normalUsePoint.grossAmount
            }]を引きました。[${dateConverter(normalGetPoint.fTxnDate)}]のレコードの残高は[${0}/${
              normalGetPoint.grossAmount
            }]です。`,
          });
          normalGetPoint.netAmount = 0;
          normalUsePoint.netAmount = difference;
          normalGetPoints[j] = normalGetPoint;
          normalUsePoints[i] = normalUsePoint;
        }
      }
    }
  }

  history = _.sortBy(history, [
    (o: { date: number; log: string }) => {
      const seconds = o.date;
      return seconds;
    },
  ]);

  history.forEach((item) => {
    console.log(item.log);
  });
}

export function printHistory(pointWithHistoryArray: PointWithHistory[]) {
  const printablePoints: PrintablePoint[] = [];
  pointWithHistoryArray.forEach((pointWithHistory) => {
    const parentPoint = pointWithHistory.point;
    const childPoints = pointWithHistory.history;
    [parentPoint, ...childPoints].forEach((point, i) => {
      const fTxnDate = dateConverter(point.fTxnDate);
      const { action } = point;
      const isLimitedType = point.isLimitedType ? 'LIMITED' : 'NORMAL';
      const printablePoint: PrintablePoint = {
        id: `${point.fTxnDate.getTime()}`,
        date: fTxnDate,
        action: action === 'GET' ? '親' : '子',
        type: isLimitedType,
        price:
          action === 'GET'
            ? `${point.netAmount} / ${point.grossAmount}`
            : `${point.netAmount} / ${point.grossAmount}`,
      };
      printablePoints.push(printablePoint);
    });
  });

  return printablePoints;
}
