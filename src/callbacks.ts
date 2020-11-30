/* eslint-disable no-underscore-dangle */
import { printTable } from 'console-table-printer';
import _ from 'lodash';

import { Point } from './classes/Point';
import { dateConverter } from './utils/date';

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
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    if (p.action === 'GET') {
      if (p.isLimitedType) {
        limitedPointsAmount = p.netAmount;
      } else if (!p.isLimitedType) {
        normalPointsAmount = p.netAmount;
      }
    }
  }
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

  // 現在確定していて使用できるPointレコードの配列
  const confirmedPoints = _.filter(points, (o: Point) => {
    return o.fTxnDate.getTime() <= today.getTime();
  });
  // 取引日より後の反映日のPointレコードの配列
  const notConfirmedPoints = _.filter(points, (o: Point) => {
    return o.fTxnDate.getTime() > today.getTime();
  });

  const amountResult = amount(confirmedPoints);
  const confirmedAmount = amountResult.amount;
  if (fee > 0 && confirmedAmount >= fee) {
    const sortedPoints = sortByFTxnDate(confirmedPoints);
    let tmpFee = fee;
    let limitedFee = 0;
    let normalFee = 0;
    // 期間限定ポイントの取得 Limited Sorted Points
    const limitedGetPoints = _.filter(sortedPoints, (o: Point) => {
      return o.isLimitedType && o.action === 'GET';
    });
    const limitedUsePoints = _.filter(sortedPoints, (o: Point) => {
      return o.isLimitedType && o.action === 'USE';
    });
    // 通常ポイントの取得 Not Limited Sorted Points
    const normalGetPoints = _.filter(sortedPoints, (o: Point) => {
      return !o.isLimitedType && o.action === 'GET';
    });
    const normalUsePoints = _.filter(sortedPoints, (o: Point) => {
      return !o.isLimitedType && o.action === 'USE';
    });

    // まずは、期間限定ポイントのみから計算を行う
    for (let i = 0; i < limitedGetPoints.length; i += 1) {
      const point = limitedGetPoints[i];
      // 計算を行う
      const paymentActionResult = point.paymentAction(tmpFee);
      // 入れ替える
      // limitedGetPoints[i] = point;
      tmpFee = paymentActionResult.remainder;
      // 今回の計算だけで終了させるか問う
      if (paymentActionResult.isEnough) {
        break;
      }
    }
    // 期間限定ポイントのうち使ったポイント数
    limitedFee = fee - tmpFee;
    /**
     * 次に、通常ポイントのみの計算を行う
     * 期間限定ポイントだけで計算が終わっているならそのままスキップする
     */
    if (tmpFee > 0) {
      for (let i = 0; i < normalGetPoints.length; i += 1) {
        const point = normalGetPoints[i];
        // 計算を行う
        const paymentActionResult = point.paymentAction(tmpFee);
        // 入れ替える
        // normalGetPoints[i] = point;
        tmpFee = paymentActionResult.remainder;
        // 今回の計算だけで終了させるか問う
        if (paymentActionResult.isEnough) {
          break;
        }
      }
    }
    // 通常ポイントのうち使ったポイント数
    normalFee = fee - limitedFee;
    // pointsを更新する
    // このnewPointsが怪しい
    const newPoints = [
      ...normalGetPoints,
      ...limitedGetPoints,
      ...normalUsePoints,
      ...limitedUsePoints,
      ...notConfirmedPoints,
    ];
    // 利用した金額をPointsに追加する
    // まずは期間限定から
    let newLimitedUsePoint: Point | undefined;
    let newNormalUsePoint: Point | undefined;

    if (limitedFee > 0) {
      newLimitedUsePoint = new Point(limitedFee, counterparty, 'LIMITED', 'USE');
      newPoints.push(newLimitedUsePoint);
    }
    // 次に期間限定ポイントを使い切って通常ポイントを使った場合
    if (normalFee > 0) {
      newNormalUsePoint = new Point(normalFee, counterparty, 'NORMAL', 'USE');
      newPoints.push(newNormalUsePoint);
    }
    // pointsを日付順にソーティングする（昇順）
    return {
      points: sortByFTxnDate(newPoints),
      limitedUsePoint: newLimitedUsePoint || null,
      normalUsePoint: newNormalUsePoint || null,
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
    // 期間限定ポイントの取得 Limited Sorted Points
    const limitedGetPoints = _.filter(sortedPoints, (o: Point) => {
      return o.isLimitedType && o.action === 'GET';
    });
    // 通常ポイントの取得 Not Limited Sorted Points
    const normalGetPoints = _.filter(sortedPoints, (o: Point) => {
      return !o.isLimitedType && o.action === 'GET';
    });

    // まずは、期間限定ポイントのみから計算を行う
    if (usePoint.isLimitedType) {
      for (let i = 0; i < limitedGetPoints.length; i += 1) {
        const point = limitedGetPoints[i];
        // 計算を行う
        const paResult = point.paymentAction(tmpFee);
        // 入れ替える
        limitedGetPoints[i] = point;
        tmpFee = paResult.remainder;
        // 今回の計算だけで終了させるか問う
        if (paResult.isEnough) {
          break;
        }
      }
    }
    /**
     * 次に、通常ポイントのみの計算を行う
     * 期間限定ポイントだけで計算が終わっているならそのままスキップする
     */
    if (tmpFee > 0 && !usePoint.isLimitedType) {
      for (let i = 0; i < normalGetPoints.length; i += 1) {
        const point = normalGetPoints[i];
        // 計算を行う
        const paResult = point.paymentAction(tmpFee);
        // 入れ替える
        normalGetPoints[i] = point;
        tmpFee = paResult.remainder;
        // 今回の計算だけで終了させるか問う
        if (paResult.isEnough) {
          break;
        }
      }
    }

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
  // 期間限定ポイントの取得 Limited Sorted Points
  const limitedGetPoints = _.filter(sortedPoints, (o: Point) => {
    return o.isLimitedType && o.action === 'GET';
  });
  // 期間限定ポイントを使用したことを示すレコードの配列
  const limitedUsePoints = _.filter(sortedPoints, (o: Point) => {
    return o.isLimitedType && o.action === 'USE';
  });
  // 通常ポイントの取得 Not Limited Sorted Points
  const normalGetPoints = _.filter(sortedPoints, (o: Point) => {
    return !o.isLimitedType && o.action === 'GET';
  });
  // 通常ポイントを使用したことを示すレコードの配列
  const normalUsePoints = _.filter(sortedPoints, (o: Point) => {
    return !o.isLimitedType && o.action === 'USE';
  });

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
