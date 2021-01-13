/* eslint-disable import/no-extraneous-dependencies */
import faker from 'faker';
import random from 'random';

import { amount, sortByFTxnDate } from './callbacks';
import { Point } from './classes/Point';
import { dividePointsByType, paymentActionLoop } from './utils/points';

type TransactionType = 'NORMAL' | 'LIMITED' | 'UNKNOWN';
type TransactionAction = 'GET' | 'USE' | 'UNKNOWN';

const POINT_TYPES: TransactionType[] = ['NORMAL', 'LIMITED'];
const POINT_ACTIONS: TransactionAction[] = ['GET', 'USE'];

export function generatePointValue() {
  const billingAmount = random.int(500, 10000);
  const weighting = Math.floor(billingAmount / 500);
  const value = weighting * 200;
  return value;
}

export function payMock(points: Point[], pointValue: number, counterparty: string) {
  const amountResult = amount(points);
  const confirmedAmount = amountResult.amount;
  if (pointValue > 0 && confirmedAmount >= pointValue) {
    const sortedPoints = sortByFTxnDate(points);
    let tmpFee = pointValue;
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
    limitedFee = pointValue - tmpFee;
    limitedGetPoints = paymentActionLoopResult.points;

    paymentActionLoopResult = paymentActionLoop(normalGetPoints, tmpFee);
    tmpFee = paymentActionLoopResult.fee;
    normalGetPoints = paymentActionLoopResult.points;
    normalFee = pointValue - limitedFee;

    const newPoints = [
      ...normalGetPoints,
      ...limitedGetPoints,
      ...normalUsePoints,
      ...limitedUsePoints,
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
}

export function generatePoints(length: number, counterparties: string[], startDate: Date) {
  const points: Point[] = [];
  let newCounterparties: string[] = [];

  if (counterparties.length === 0) {
    for (let i = 0; i < 3; i += 1) {
      newCounterparties.push(faker.company.companyName());
    }
  } else {
    newCounterparties = counterparties;
  }

  for (let i = 0; i < length; i += 1) {
    /**
     * ポイント数生成
     */
    const pointValue = generatePointValue();
    const pointAction = POINT_ACTIONS[random.int(0, 1)];
    const counterparty = newCounterparties[random.int(0, newCounterparties.length - 1)];
    const fTxnDate = new Date(startDate.getTime());
    fTxnDate.setDate(startDate.getDate() + i);
    let point: Point | null = null;

    if (pointAction === 'GET') {
      const pointType = POINT_TYPES[random.int(0, 1)];
      point = new Point(pointValue, counterparty, pointType, pointAction);
      point.fTxnDate = fTxnDate;
      point.txnDate = fTxnDate;
      points.push(point);
    } else {
      const { limitedUsePoint, normalUsePoint } = payMock(points, pointValue, counterparty);

      if (limitedUsePoint) {
        limitedUsePoint.fTxnDate = fTxnDate;
        limitedUsePoint.txnDate = fTxnDate;
        points.push(limitedUsePoint);
      }
      if (normalUsePoint) {
        normalUsePoint.fTxnDate = fTxnDate;
        normalUsePoint.txnDate = fTxnDate;
        points.push(normalUsePoint);
      }

      if (!limitedUsePoint && !normalUsePoint) {
        i -= 1;
      }
    }
  }

  /*
  print(points);

  const {
    limitedGetPoints,
    limitedUsePoints,
    normalGetPoints,
    normalUsePoints,
  } = dividePointsByType(reset(points));

  print(limitedGetPoints);
  print(limitedUsePoints);
  print(normalGetPoints);
  print(normalUsePoints);
  */
  return points;
}
