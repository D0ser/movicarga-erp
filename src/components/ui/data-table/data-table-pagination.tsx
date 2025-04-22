"use client";

import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps<TData> {
	table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
	return (
		<div className="flex items-center justify-between px-2">
			<div className="flex-1 text-sm text-muted-foreground">
				{table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
			</div>
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Filas por página</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}>
						<SelectTrigger className="h-8 w-[70px] focus-visible:ring-primary border-primary/20">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top" className="border-primary/20">
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`} className="hover:bg-primary/10">
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						className={cn("hidden h-8 w-8 p-0 lg:flex border-primary/20", "hover:bg-primary/10 disabled:opacity-50")}
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}>
						<span className="sr-only">Ir a la primera página</span>
						<ChevronsLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className={cn("h-8 w-8 p-0 border-primary/20", "hover:bg-primary/10 disabled:opacity-50")}
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						<span className="sr-only">Ir a la página anterior</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</Button>
					<Button variant="outline" className={cn("h-8 w-8 p-0 border-primary/20", "hover:bg-primary/10 disabled:opacity-50")} onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
						<span className="sr-only">Ir a la página siguiente</span>
						<ChevronRightIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className={cn("hidden h-8 w-8 p-0 lg:flex border-primary/20", "hover:bg-primary/10 disabled:opacity-50")}
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}>
						<span className="sr-only">Ir a la última página</span>
						<ChevronsRightIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
