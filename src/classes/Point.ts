type TransactionType = 'NORMAL' | 'LIMITED' | 'UNKNOWN';

type TransactionAction = 'GET' | 'USE' | 'UNKNOWN';

export interface Point {
  id: string;
  groupId: string;
  txnDate: Date; // 利用日 transaction date
  fTxnDate: Date; // 反映日 final transaction date
  detail: string; // ご利用内容詳細
  counterparty: string; // 取引先の企業名
  type: TransactionType; // 種別
  grossAmount: number; // 取得したり利用したポイントの差し引く前の総額
  expirationDate: Date; // 有効期限
  isLimitedType: boolean; // 期間限定かどうか
  netAmount: number; // 取得したポイントの差し引いた後の総額
  action: TransactionAction; // 利用したのか獲得したのか
}

export class Point implements Point {
  public id: string;

  public groupId: string;

  public txnDate: Date;

  public fTxnDate: Date;

  public detail: string;

  public counterparty: string;

  public type: TransactionType;

  public grossAmount: number;

  public netAmount: number;

  public expirationDate: Date;

  public isLimitedType: boolean;

  public action: TransactionAction;

  constructor(
    grossAmount: number = 0,
    counterparty: string = '',
    type: TransactionType = 'UNKNOWN',
    action: TransactionAction = 'UNKNOWN',
  ) {
    const dt = new Date();
    // 今日の日付
    this.txnDate = dt;
    // デフォルトではそのまま反映させる
    this.fTxnDate = dt;
    // 1年後
    this.expirationDate = new Date(new Date().setMonth(dt.getMonth() + 12));
    this.grossAmount = grossAmount;
    this.netAmount = grossAmount;
    // 企業名をそのまま内容詳細にいれる
    this.detail = type === 'LIMITED' ? `（期間・用途限定）${counterparty}` : counterparty;
    this.counterparty = counterparty;
    this.type = type;
    this.action = action;
    this.isLimitedType = type === 'LIMITED' || false;
    this.id = '';
    this.groupId = '';
  }

  /**
   * 反映日を設定し、自動的に有効期限日を設定する
   * @param d 何日後か
   */
  public setFTxnDate(d: number) {
    if (d >= 0) {
      const dt = new Date();
      const nFTxnD = new Date(dt.setDate(dt.getDate() + d));
      this.fTxnDate = nFTxnD;
      const nExpD = new Date(
        new Date(dt.setDate(dt.getDate() + d)).setMonth(nFTxnD.getMonth() + 12),
      );
      this.expirationDate = nExpD;
    }
    return this;
  }

  /**
   * netAmount より与えられた amount が大きいか小さいかを判断し、大きければnetAmountを新しい値に更新して余りを0にして返す。
   * 小さければ、netAmountを0に更新して、足りなかった部分は余りとして返す。
   * @param a 利用料
   */
  public paymentAction(a: number) {
    if (a <= this.netAmount) {
      const b = this.netAmount - a;
      this.netAmount = b;
      return {
        isEnough: true,
        remainder: 0,
      };
    }
    const c = a - this.netAmount;
    this.netAmount = 0;
    return {
      isEnough: false,
      remainder: c,
    };
  }
}

/**
 * Firestore用のデータコンバーター
 */
export const pointConverter = {
  toFirestore: (point: Point) => {
    return {
      txnDate: point.txnDate,
      fTxnDate: point.fTxnDate,
      detail: point.detail,
      counterparty: point.counterparty,
      type: point.type,
      grossAmount: point.grossAmount,
      expirationDate: point.expirationDate,
      isLimitedType: point.isLimitedType,
      netAmount: point.netAmount,
      action: point.action,
      id: point.id,
      groupId: point.groupId,
    };
  },
  fromFirestore: (snapshot: any, options?: any) => {
    const data = snapshot.data(options);
    const p = new Point(data.grossAmount, data.counterparty, data.type, data.action);
    p.fTxnDate = new Date(data.fTxnDate.seconds * 1000);
    p.txnDate = new Date(data.txnDate.seconds * 1000);
    p.expirationDate = new Date(data.expirationDate.seconds * 1000);
    p.id = data.id;
    p.groupId = data.groupId;
    return p;
  },
};

export const pointConverterForAdmin = {
  toFirestore: (point: Point) => {
    return {
      txnDate: point.txnDate,
      fTxnDate: point.fTxnDate,
      detail: point.detail,
      counterparty: point.counterparty,
      type: point.type,
      grossAmount: point.grossAmount,
      expirationDate: point.expirationDate,
      isLimitedType: point.isLimitedType,
      netAmount: point.netAmount,
      action: point.action,
    };
  },
  fromFirestore: (data: any, options?: any) => {
    const p = new Point(data.grossAmount, data.counterparty, data.type, data.action);
    p.fTxnDate = new Date(data.fTxnDate.seconds * 1000);
    p.txnDate = new Date(data.txnDate.seconds * 1000);
    p.expirationDate = new Date(data.expirationDate.seconds * 1000);
    return p;
  },
};
