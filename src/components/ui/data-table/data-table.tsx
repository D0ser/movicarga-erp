"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Download, Filter, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options";
import { DataTableExport } from "@/components/ui/data-table/data-table-export";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	title?: string;
	description?: string;
	searchKey?: string;
	searchPlaceholder?: string;
	onRowAction?: (row: TData, action: string) => void;
	filterableColumns?: {
		id: string;
		title: string;
		options: { label: string; value: string; icon?: React.ReactNode }[];
	}[];
	onExport?: (data: TData[]) => void;
	enableExport?: boolean;
	enablePagination?: boolean;
	enableColumnToggle?: boolean;
	pageSize?: number;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	title,
	description,
	searchKey,
	searchPlaceholder = "Buscar...",
	onRowAction,
	filterableColumns = [],
	onExport,
	enableExport = true,
	enablePagination = true,
	enableColumnToggle = true,
	pageSize = 10,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
		initialState: {
			pagination: {
				pageSize: pageSize,
			},
		},
	});

	// Filtrar por texto si se proporciona searchKey
	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (searchKey) {
			table.getColumn(searchKey)?.setFilterValue(event.target.value);
		}
	};

	return (
		<Card className="border-primary/20">
			{(title || description) && (
				<CardHeader className="bg-primary/5">
					{title && <CardTitle className="text-primary text-xl">{title}</CardTitle>}
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
			)}
			<CardContent>
				<div className="flex items-center justify-between py-4">
					<div className="flex flex-1 items-center space-x-2">
						{searchKey && (
							<Input placeholder={searchPlaceholder} value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""} onChange={handleSearch} className="max-w-sm focus-visible:ring-primary" />
						)}
					</div>

					<div className="flex items-center space-x-2">
						{filterableColumns.length > 0 && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="ml-auto border-primary/20 text-primary hover:bg-primary/10">
										<Filter className="mr-2 h-4 w-4" />
										Filtros
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="border-primary/20">
									{filterableColumns.map((column) => (
										<React.Fragment key={column.id}>
											<DropdownMenuLabel className="text-primary">{column.title}</DropdownMenuLabel>
											{column.options.map((option) => (
												<DropdownMenuCheckboxItem
													key={option.value}
													checked={table.getColumn(column.id)?.getFilterValue() === option.value}
													onCheckedChange={() => {
														if (table.getColumn(column.id)?.getFilterValue() === option.value) {
															table.getColumn(column.id)?.setFilterValue(null);
														} else {
															table.getColumn(column.id)?.setFilterValue(option.value);
														}
													}}
													className="hover:bg-primary/10">
													{option.icon}
													{option.label}
												</DropdownMenuCheckboxItem>
											))}
											<DropdownMenuSeparator />
										</React.Fragment>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}

						{enableColumnToggle && <DataTableViewOptions table={table} />}

						{enableExport && (
							<Button onClick={() => onExport && onExport(data)} size="sm" className="bg-secondary hover:bg-secondary-dark text-white">
								<Download className="mr-2 h-4 w-4" />
								Exportar
							</Button>
						)}
					</div>
				</div>

				<div className="rounded-md border border-primary/20">
					<Table>
						<TableHeader className="bg-primary/5">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>;
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-primary/5">
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-24 text-center">
										No se encontraron resultados.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{enablePagination && (
					<div className="py-4">
						<DataTablePagination table={table} />
					</div>
				)}
			</CardContent>
		</Card>
	);
}
