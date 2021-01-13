import { calc, amount, print } from '../callbacks';
import { Point } from '../classes/Point';
import { dividePointsByType } from './points';

export function getRemainings(points: Point[]) {
  const calculatedPoints = calc(points);
  const {
    limitedGetPoints,
    limitedUsePoints,
    normalGetPoints,
    normalUsePoints,
  } = dividePointsByType(calculatedPoints);
  console.log('↓ normalGetPoints');
  print(normalGetPoints);
  console.log('↓ normalUsePoints');
  print(normalUsePoints);
  console.log('↓ limitedGetPoints');
  print(limitedGetPoints);
  console.log('↓ limitedUsePoints');
  print(limitedUsePoints);
  const { normalPointsAmount, limitedPointsAmount } = amount(calculatedPoints);
  return {
    normalRemainings: amount(normalGetPoints).normalPointsAmount,
    limitedRemainings: amount(limitedGetPoints).limitedPointsAmount,
  };
}
