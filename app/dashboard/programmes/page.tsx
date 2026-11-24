"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, ChevronLeft, ChevronRight, CircleX, Loader2, Pause, Pencil, Play, Plus } from "lucide-react";
import { ModalDeposit } from "@/components/ModalDeposit";
import { PageHeader } from "@/components/PageHeader";
import { ModalNewProgram } from "@/components/ModalNewProgram";
import { EditProgrammeDialog } from "@/components/ProgrammeDetails";
import { ProgrammeSummary } from "@/components/ProgrammeSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatInstitutionStatus } from "@/lib/institution-display";
import { useActivateProgramme, useCloseProgramme, usePauseProgramme } from "@/hooks/api/use-institution-mutations";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { useInstitutionProgramme, useInstitutionProgrammes } from "@/hooks/api/use-institution-categories";
import type { Programme } from "@/lib/api/programmes";

function formatProgrammeDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function statusVariant(status?: string): "secondary" | "success" | "warning" | "outline" | "destructive" {
  switch (status?.toLowerCase()) {
    case "active":
      return "success";
    case "paused":
      return "warning";
    case "closed":
      return "outline";
    case "rejected":
    case "declined":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatFunding(value?: string): string {
  if (!value) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProgrammesPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [editing, setEditing] = useState<Programme | null>(null);
  const { data: institution } = useInstitutionProfile();
  const programmes = useInstitutionProgrammes(institution?.id, page);
  const activateProgramme = useActivateProgramme();
  const pauseProgramme = usePauseProgramme();
  const closeProgramme = useCloseProgramme();
  const selected = useInstitutionProgramme(institution?.id, editing?.id);
  const items = programmes.data?.items ?? [];
  const pagination = programmes.data?.pagination;
  const totalPages = Math.max(pagination?.totalPages ?? 0, items.length > 0 ? 1 : 0);
  const total = pagination?.total ?? items.length;

  useEffect(() => {
    if (programmes.isLoading || programmes.isError) return;
    if (items.length === 0) {
      setSelectedId(undefined);
      return;
    }
    if (!items.some((programme) => programme.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, programmes.isError, programmes.isLoading, selectedId]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Programmes"
        subtitle="Create and manage programmes for your institution"
        actions={
          <ModalNewProgram>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New programme
            </Button>
          </ModalNewProgram>
        }
      />

      <ProgrammeSummary programmeId={selectedId} />

      <Card>
        <CardContent className="p-0 sm:p-2">
          {programmes.isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#009688]" />
            </div>
          ) : programmes.isError ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3">
              <p className="text-sm text-red-600">Could not load programmes.</p>
              <Button variant="outline" size="sm" onClick={() => programmes.refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-[#666d80]">No programmes yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Programme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Funding target</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((programme) => (
                  <TableRow
                    key={programme.id}
                    data-state={programme.id === selectedId ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(programme.id)}
                  >
                    <TableCell>
                      <p className="font-medium text-[#0d0d12]">{programme.name}</p>
                      <p className="mt-0.5 text-sm text-[#666d80]">{programme.description || "No description"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(programme.status)}>
                        {formatInstitutionStatus(programme.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[#666d80]">
                      {formatProgrammeDate(programme.startDate)} – {formatProgrammeDate(programme.endDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatFunding(programme.fundingTarget)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {programme.status?.toLowerCase() !== "closed" && (
                          <ModalDeposit programmeId={programme.id}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <ArrowDownToLine className="h-4 w-4" />
                              Deposit
                            </Button>
                          </ModalDeposit>
                        )}
                        {programme.status?.toLowerCase() === "draft" && institution?.id && (
                          <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={activateProgramme.isPending}
                            onClick={() =>
                              activateProgramme.mutate({
                                institutionId: institution.id,
                                programmeId: programme.id,
                              })
                            }
                          >
                            {activateProgramme.isPending &&
                            activateProgramme.variables?.programmeId === programme.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            Activate
                          </Button>
                        )}
                        {programme.status?.toLowerCase() === "active" && institution?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={pauseProgramme.isPending}
                            onClick={() =>
                              pauseProgramme.mutate({
                                institutionId: institution.id,
                                programmeId: programme.id,
                              })
                            }
                          >
                            {pauseProgramme.isPending && pauseProgramme.variables?.programmeId === programme.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                            Pause
                          </Button>
                        )}
                        {programme.status?.toLowerCase() !== "closed" && institution?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={closeProgramme.isPending}
                            onClick={() =>
                              closeProgramme.mutate({
                                institutionId: institution.id,
                                programmeId: programme.id,
                              })
                            }
                          >
                            {closeProgramme.isPending && closeProgramme.variables?.programmeId === programme.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CircleX className="h-4 w-4" />
                            )}
                            Close
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(programme)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!programmes.isLoading && !programmes.isError && (
            <div className="flex flex-col items-start justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-sm text-[#666d80]">
                {total} {total === 1 ? "programme" : "programmes"}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-[#666d80]">
                    Page {pagination?.page ?? page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && institution?.id && (
        <EditProgrammeDialog
          open
          institutionId={institution.id}
          programmeId={editing.id}
          name={selected.data?.name ?? editing.name}
          description={selected.data?.description ?? editing.description ?? ""}
          startDate={selected.data?.startDate ?? editing.startDate ?? ""}
          endDate={selected.data?.endDate ?? editing.endDate ?? ""}
          fundingTarget={selected.data?.fundingTarget ?? editing.fundingTarget ?? ""}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
