import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

interface SkeletonRowsProps {
  columnCount: number;
  rowCount?: number;
}

export function SkeletonRows({ columnCount, rowCount = 3 }: SkeletonRowsProps) {
  return (
    <TableBody>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`} className="">
          {Array.from({ length: columnCount }, (_, colIndex) => (
            <TableCell
              key={`skeleton-${rowIndex}-${colIndex}`}
              className="px-6 h-8 py-4"
            >
              <Skeleton className="h-6 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
