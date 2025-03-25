export type FindOptionDto = Partial<{
  /**
   * The page sort order.
   */
  sort: 'asc' | 'desc';

  /**
   * The page number.
   */
  page: number;

  /**
   * The page size.
   */
  limit: number;

  /**
   * The minimum date to search by creation date.
   * Can accept a number in timestamp format.
   */
  from: number;

  /**
   * The maximum date to search by creation date.
   * Can accept a number in timestamp format.
   */
  to: number;
}>;
