# Poinco

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Github Actions](https://github.com/takagimeow/poinco/workflows/Poinco%20Test/badge.svg)](https://github.com/takagimeow/poinco)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![NPM version](https://img.shields.io/npm/v/poinco.svg?style=flat-square)](https://npmjs.com/package/poinco)
[![NPM downloads](https://img.shields.io/npm/dm/poinco.svg?style=flat-square)](https://npmjs.com/package/poinco)

<div align="center">
<img src="https://user-images.githubusercontent.com/66447334/100410599-92caac80-30b2-11eb-9b22-6b9112f0ff50.png" title="アイコン">
</div>

## Installation

### Yarnを使う場合

```bash
$ yarn add poinco
```

### npmを使う場合

```bash
$ npm install poinco
```

## Usage

```js
import { pay, Point } from 'poinco';

let points: Point[] = [];
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

const pointAmount = 250;
const counterparty = 'GRIDS SAPPORO';

const payResult = pay(points, pointAmount, counterparty);
const estimatedPoint = Poinco.estimate(billingAmount - substractor, 0.01);
const gp =
  estimatedPoint > 0 ? new Point(estimatedPoint, counterparty, 'NORMAL', 'GET') : null;

const checkoutResult = {
  use: {
    limited: payResult.limPoint,
    normal: payResult.normPoint,
  },
  get: {
    limited: null,
    normal: gp,
  },
};
```

### Point

```ts
import { Point } from 'poinco';

const poinco = new Point(100, '企業名', 'NORMAL', 'GET'),
```

## Functions

### estimate


お客さんに還元されるポイントの総数を計算する


| 引数 | 内容 |
| ---- | ---- |
| billingAmount | お客さんが支払う総額 |
| interestRate | 適用するポイント還元率 |


```ts
import { poinco } from 'poinco';

const billingAmount = 2500;
const interestRate = 0.01;

poinco.estimate(billingAmount, interestRate);
```

### sortByFTxnDate


pointクラスのfTxnDateプロパティ（反映日）に基づいてソーティングをかける


| 引数 | 内容 |
| ---- | ---- |
| points | Pointクラスのインスタンスの配列 |

```ts
import { poinco } from 'poinco';

...

poinco.sortByFTxnDate(points);
```

### reverse

PointクラスのfTxnDateプロパティ（反映日）に基づいてソーティングを行い、昇順から降順にするためリバースをかける

| 引数 | 内容 |
| ---- | ---- |
| points | Pointクラスのインスタンスの配列 |

```ts
import { poinco } from 'poinco';

...

poinco.reverse(points);
```

### print

Pointクラスのインスタンスの配列をテーブルを使ってログ形式で出力する

| 引数 | 内容 |
| ---- | ---- |
| points | Pointクラスのインスタンスの配列 |

```ts
import { poinco } from 'poinco';

...

poinco.print(points);
```

### amount

引数であるpointsのnetAmountプロパティを基に期間限定ポイント、通常ポイント、その総額ポイント数を計算する

※必ずcalc関数を実行してからamountを呼び出すことを推奨。
未計算のnetAmountプロパティを基に利用可能なポイント数を算出する可能性があり、意図したポイントの総額を取得できない可能性があるため

| 引数 | 内容 |
| ---- | ---- |
| points | Pointクラスのインスタンスの配列 |

| 戻り値オブジェクトのプロパティ名 | 型 | 内容 |
| ---- | ---- | ---- | 
| limitedPointsAmount | number | 期間・用途限定ポイントの総額 |
| normalPointsAmount | number | 通常ポイントの総額 |
| amount | number | すべてポイントの総額 |

```ts
import { poinco } from 'poinco';

...

points = poinco.calc(points);
const result = poinco.amount(points);

console.log(`期間・用途限定ポイント: ${result.limitedAmount}`);
console.log(`通常ポイント: ${result.normalAmount}`);
console.log(`総額ポイント: ${result.amount}`);
```


### pay

与えられたPointクラスのインスタンスの配列（残高）の中からポイントを使用する場合の計算を行う

| 引数 | 型 | 内容 |
| ---- | ---- | ---- | 
| points | Point[] | Pointクラスのインスタンスの配列 |
| fee | number | 使用するポイント数 |
| counterparty | string | 取引先企業名 |

| 戻り値オブジェクトのプロパティ名 | 型 | 内容 |
| ---- | ---- | ---- |
| points | Point[] | 新しい期間限定・用途ポイントと通常ポイントのPointクラスのインスタンスが追加された新しい残高 |
| limitedUsePoint | Point | 追加された期間限定・用途ポイントのPointクラスのインスタンス |
| normalUsePoint | Point | 追加された通常ポイントのPointクラスのインスタンス |

```ts
import { pay } from 'poinco';

...

/**
 * ポイントを使用
 */
const payResult = pay(points, pointAmount, counterparty);
/**
 * 取得できるポイントを計算
 */
let substractor = payResult.limPoint ? payResult.limPoint.grossAmount : 0;
substractor += payResult.normPoint ? payResult.normPoint.grossAmount : 0;
const estimatedPoint = Poinco.estimate(billingAmount - substractor, 0.01);
const gp =
  estimatedPoint > 0 ? new Point(estimatedPoint, counterparty, 'NORMAL', 'GET') : null;

const checkoutResult = {
  use: {
    limited: payResult.limPoint,
    normal: payResult.normPoint,
  },
  get: {
    limited: null,
    normal: gp,
  },
};
```

### applyUsePoint

引数のPointクラスのインスタンスに対してUSEポイントを割り当てる

| 引数 | 型 | 内容 |
| ---- | ---- | ---- |
| points | Point[] | Pointクラスのインスタンスの配列 |
| usePoint | Point | actionプロパティがUSEのPointクラスのインスタンス |

| 戻り値 | 型 | 内容 |
| ---- | ---- | ---- |
| points | Point[] | usePointが割り当てられてnetAmountが更新されたPointクラスのインスタンスの配列 |

```ts
import { sortByFTxnDate, applyUsePoint } from 'poinco';

...

const usePoints = sortByFTxnDate([...limitedUsePoints, ...normalUsePoints]);
let getPoints = sortByFTxnDate([...limitedGetPoints, ...normalGetPoints]);

usePoints.forEach((point: Point) => {
  getPoints = applyUsePoint(getPoints, point);
});
```

### calc

引数のpointsの中からUSEポイントとGETポイントを振り分けて、payForCalc関数を使ってひとつずつGETポイントの配列にUSEポイントを割り当てて計算を重ねてnetAmountが更新されたPointクラスのインスタンスの配列を返す

| 引数 | 型 | 内容 |
| ---- | ---- | ---- |
| points | Point[] | Pointクラスのインスタンスの配列 | 

| 戻り値 | 型 | 内容 |
| ---- | ---- | ---- |
| points | Point[] | 引数のpointsの要素のnetAmountを更新した新しいpoints |

```ts
import { reset, calc } from 'point';

...

points = reset(points);
points = calc(points);

```

### reset

引数のpointsの要素であるPointクラスのインスタンスのnetAmountを同インスタンスのgrossAmountと同じ値にしてリセットする

| 引数 | 型 | 内容 |
| ---- | ---- | ---- |
| points | Point[] | Pointクラスのインスタンスの配列 |

| 戻り値 | 型 | 内容 |
| ---- | ---- | ---- |
| points | Point[] | netAmountがリセットされたPointクラスのインスタンスの配列 |