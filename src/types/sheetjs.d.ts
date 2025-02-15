// src/types/sheetjs.d.ts
declare module 'sheetjs' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }

  export interface WorkSheet {
    [cell: string]: CellObject;
  }

  export interface CellObject {
    v: string | number | boolean | Date;
    t: string;
  }

  export function read(
    data: ArrayBuffer,
    options: { type: string; cellDates: boolean }
  ): WorkBook;

  export const utils: {
    sheet_to_json<T>(worksheet: WorkSheet, options?: { raw?: boolean }): T[];
  };
}
