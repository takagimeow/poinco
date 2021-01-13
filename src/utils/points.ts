import _ from 'lodash';

import { Point } from '../classes/Point';

export function dividePointsByDate(points: Point[], date: Date) {
  // 現在確定していて使用できるPointレコードの配列
  const confirmedPoints = _.filter(points, (o: Point) => {
    return o.fTxnDate.getTime() <= date.getTime();
  });

  // 取引日より後の反映日のPointレコードの配列
  const notConfirmedPoints = _.filter(points, (o: Point) => {
    return o.fTxnDate.getTime() > date.getTime();
  });

  return {
    confirmedPoints,
    notConfirmedPoints,
  };
}

export function dividePointsByType(points: Point[]) {
  // 期間限定ポイントの取得 Limited Sorted Points
  const limitedGetPoints = _.filter(points, (o: Point) => {
    return o.isLimitedType && o.action === 'GET';
  });
  const limitedUsePoints = _.filter(points, (o: Point) => {
    return o.isLimitedType && o.action === 'USE';
  });
  // 通常ポイントの取得 Not Limited Sorted Points
  const normalGetPoints = _.filter(points, (o: Point) => {
    return !o.isLimitedType && o.action === 'GET';
  });
  const normalUsePoints = _.filter(points, (o: Point) => {
    return !o.isLimitedType && o.action === 'USE';
  });

  return {
    limitedGetPoints,
    limitedUsePoints,
    normalGetPoints,
    normalUsePoints,
  };
}

export function paymentActionLoop(points: Point[], fee = 0) {
  if (fee <= 0)
    return {
      points,
      spentGrossAmount: 0,
      fee,
    };
  let tmpFee = fee;
  let grossAmount = 0;
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
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
    spentGrossAmount: grossAmount,
    fee: tmpFee,
  };
}
