// return-status.enum.ts
export enum ReturnStatus {
    REQUESTED = 'requested',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    RECEIVED = 'received',
    PROCESSING_REFUND = 'processing_refund',
    REFUNDED = 'refunded',
    CANCELLED = 'cancelled',
  }
  
  // return-reason.enum.ts
  export enum ReturnReason {
    DEFECTIVE = 'defective',
    WRONG_ITEM = 'wrong_item',
    NOT_AS_DESCRIBED = 'not_as_described',
    CHANGE_OF_MIND = 'change_of_mind',
    LATE_DELIVERY = 'late_delivery',
    OTHER = 'other',
  }