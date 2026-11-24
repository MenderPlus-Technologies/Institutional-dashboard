"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubmitVerificationDocuments } from "@/hooks/api/use-institution-mutations";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { toastApiError } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";

const DOCUMENT_TYPES = [
  { value: "cac_certificate", label: "CAC certificate" },
  { value: "cac_status_report", label: "CAC status report" },
  { value: "memorandum", label: "Memorandum" },
  { value: "tax_identification", label: "Tax identification" },
  { value: "proof_of_address", label: "Proof of address" },
  { value: "other", label: "Other" },
] as const;

const DEFAULT_DOCUMENT_TYPE = DOCUMENT_TYPES[0].value;

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface PendingDocument {
  key: string;
  file: File;
  documentType: string;
}

interface ModalCACVerificationProps {
  children: React.ReactNode;
}

export function ModalCACVerification({ children }: ModalCACVerificationProps) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: institution } = useInstitutionProfile();
  const submitDocuments = useSubmitVerificationDocuments();
  const isSubmitting = submitDocuments.isPending;

  const reset = () => {
    setDocuments([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next: PendingDocument[] = [];
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toastApiError(
          new ApiError({
            kind: "validation",
            status: null,
            userMessage: `${file.name} must be a PDF, JPG, or PNG.`,
            debugMessage: `Rejected file type ${file.type || "unknown"}`,
          })
        );
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toastApiError(
          new ApiError({
            kind: "validation",
            status: null,
            userMessage: `${file.name} is larger than 10 MB.`,
            debugMessage: `Rejected file size ${file.size}`,
          })
        );
        continue;
      }
      next.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${next.length}`,
        file,
        documentType: DEFAULT_DOCUMENT_TYPE,
      });
    }
    if (next.length) setDocuments((current) => [...current, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!institution?.id || documents.length === 0 || isSubmitting) return;
    submitDocuments.mutate(
      {
        institutionId: institution.id,
        documents: documents.map((document) => ({
          documentType: document.documentType,
          file: document.file,
        })),
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#009688]" />
            CAC Verification
          </DialogTitle>
          <DialogDescription>
            Upload your CAC certificate and any other documents needed for verification.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Documents</Label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8eaed] px-6 py-8">
              <Upload className="mb-2 h-6 w-6 text-[#9aa1b4]" />
              <p className="text-sm text-[#666d80]">Upload PDF, JPG, or PNG</p>
              <p className="text-caption mt-1">Up to 10 MB each. You can add more than one file.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={isSubmitting}
                onClick={() => inputRef.current?.click()}
              >
                Browse Files
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                multiple
                className="sr-only"
                onChange={(event) => addFiles(event.target.files)}
              />
            </div>
          </div>

          {documents.length > 0 && (
            <ul className="space-y-2">
              {documents.map((document) => (
                <li
                  key={document.key}
                  className="flex items-center gap-2 rounded-xl border border-[#e8eaed] bg-[#f8f9fb] p-2.5"
                >
                  <FileText className="h-4 w-4 shrink-0 text-[#009688]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0d0d12]">{document.file.name}</p>
                    <Select
                      value={document.documentType}
                      onValueChange={(value) =>
                        setDocuments((current) =>
                          current.map((item) =>
                            item.key === document.key ? { ...item, documentType: value } : item
                          )
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="mt-1.5 h-9 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={isSubmitting}
                    aria-label={`Remove ${document.file.name}`}
                    onClick={() =>
                      setDocuments((current) => current.filter((item) => item.key !== document.key))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || documents.length === 0 || !institution?.id}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Verification"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
