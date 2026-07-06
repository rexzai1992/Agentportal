"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/forms/FileUpload";
import { apiFetch } from "@/lib/fetcher";

interface ContactPerson {
  name: string;
  email: string;
  phone: string;
}

const emptyContact = (): ContactPerson => ({ name: "", email: "", phone: "" });

const STEPS = ["Company Information", "Required Documents", "Contact Person", "Company Background"];

export default function RegisterPage() {
  const params = useParams<{ type: string }>();
  const rawType = (params.type || "").toLowerCase();
  const partyType = rawType === "partner" ? "PARTNER" : "AGENT";
  const isAgent = partyType === "AGENT";

  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    registrationNo: "",
    email: "",
    kplLicenseNo: "",
    kplExpiryDate: "",
    contactNo: "",
    fax: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    postcode: "",
    country: "",
    state: "",
    targetMarket: "",
    salesChannel: ""
  });

  const [contacts, setContacts] = useState<ContactPerson[]>([emptyContact()]);
  const [kplDocId, setKplDocId] = useState<string | null>(null);
  const [ssmDocId, setSsmDocId] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  const invalidType = rawType !== "agent" && rawType !== "partner";

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const documentIds = useMemo(
    () => [kplDocId, ssmDocId].filter(Boolean) as string[],
    [kplDocId, ssmDocId]
  );

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.companyName || !form.registrationNo || !form.email) return "Please complete company information";
      if (!form.contactNo || !form.addressLine1 || !form.addressLine2 || !form.postcode || !form.country || !form.state)
        return "Please complete all required company fields";
      if (isAgent && !form.kplLicenseNo) return "KPL license number is required";
    }
    if (step === 1) {
      if (!ssmDocId) return "SSM Form is required";
      if (isAgent && !kplDocId) return "KPL Form is required";
    }
    if (step === 2) {
      if (!contacts[0]?.name) return "At least one contact person name is required";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    if (!agree) {
      setError("Please accept the Privacy Policy & Terms and Conditions");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<{ applicationId: string }>("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          partyType,
          ...form,
          kplLicenseNo: isAgent ? form.kplLicenseNo : null,
          kplExpiryDate: isAgent && form.kplExpiryDate ? form.kplExpiryDate : null,
          termsAccepted: agree,
          contactPersons: contacts.filter((c) => c.name.trim()),
          documentIds
        })
      });
      setApplicationId(result.applicationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (invalidType) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <p className="text-slate-700">Unknown registration type.</p>
          <Link href="/login" className="mt-2 inline-block text-emerald-700">
            Back to Login
          </Link>
        </Card>
      </div>
    );
  }

  if (applicationId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            ✓
          </div>
          <h1 className="text-xl font-bold text-slate-900">Well done!</h1>
          <p className="mt-1 text-sm text-slate-600">
            Thank you for signing up. Your application will take up to 7 working days to be approved.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">Application ID</p>
          <p className="text-2xl font-black tracking-widest text-slate-900">{applicationId}</p>
          <Link href="/login" className="mt-6 inline-block">
            <Button>Back to Login Page</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-2xl">
          <h1 className="text-xl font-bold text-slate-900">Terms and Conditions</h1>
          <p className="mt-3 text-sm text-slate-600">
            By registering as {isAgent ? "an agent" : "a partner"}, you agree to comply with our terms
            and conditions, which include providing accurate information, maintaining the confidentiality
            of your account, and adhering to all applicable laws.
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Please prepare the following documents for upload:
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
            {isAgent ? <li>KPL Form</li> : null}
            <li>SSM Form</li>
          </ul>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button onClick={() => setAccepted(true)}>Accept</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            Register as {isAgent ? "Agent" : "Partner"}
          </h1>
          <Link href="/login" className="text-sm text-emerald-700">
            Back to Login
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${index <= step ? "bg-emerald-500" : "bg-slate-200"}`}
              />
              <p className="mt-1 text-[11px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          {error ? (
            <p className="mb-3 rounded-xl bg-red-50 p-2 text-sm text-red-600">{error}</p>
          ) : null}

          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company Name *">
                <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
              </Field>
              <Field label="Company Registration Number *">
                <Input value={form.registrationNo} onChange={(e) => set("registrationNo", e.target.value)} />
              </Field>
              <Field label="Email Address *" full>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              {isAgent ? (
                <>
                  <Field label="KPL License Number *">
                    <Input value={form.kplLicenseNo} onChange={(e) => set("kplLicenseNo", e.target.value)} />
                  </Field>
                  <Field label="KPL Expiry Date (min 2 months before expiry)">
                    <Input type="date" value={form.kplExpiryDate} onChange={(e) => set("kplExpiryDate", e.target.value)} />
                  </Field>
                </>
              ) : null}
              <Field label="Contact No *">
                <Input value={form.contactNo} onChange={(e) => set("contactNo", e.target.value)} />
              </Field>
              <Field label="Fax No">
                <Input value={form.fax} onChange={(e) => set("fax", e.target.value)} />
              </Field>
              <Field label="Address 1 *" full>
                <Input value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
              </Field>
              <Field label="Address 2 *" full>
                <Input value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} />
              </Field>
              <Field label="Address 3" full>
                <Input value={form.addressLine3} onChange={(e) => set("addressLine3", e.target.value)} />
              </Field>
              <Field label="Postcode *">
                <Input value={form.postcode} onChange={(e) => set("postcode", e.target.value)} />
              </Field>
              <Field label="Country *">
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
              </Field>
              <Field label="State *">
                <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4">
              {isAgent ? (
                <FileUpload
                  label="KPL Form"
                  required
                  docType="KPL"
                  ownerType="REGISTRATION"
                  onUploaded={(r) => setKplDocId(r?.documentId ?? null)}
                />
              ) : null}
              <FileUpload
                label="SSM Form"
                required
                docType="SSM"
                ownerType="REGISTRATION"
                onUploaded={(r) => setSsmDocId(r?.documentId ?? null)}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Contact Person {index + 1}</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      placeholder="Full Name *"
                      value={contact.name}
                      onChange={(e) =>
                        setContacts((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, name: e.target.value } : c))
                        )
                      }
                    />
                    <Input
                      placeholder="Email Address"
                      value={contact.email}
                      onChange={(e) =>
                        setContacts((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, email: e.target.value } : c))
                        )
                      }
                    />
                    <Input
                      placeholder="Phone Number"
                      value={contact.phone}
                      onChange={(e) =>
                        setContacts((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, phone: e.target.value } : c))
                        )
                      }
                    />
                  </div>
                </div>
              ))}
              {contacts.length < 3 ? (
                <Button variant="ghost" onClick={() => setContacts((prev) => [...prev, emptyContact()])}>
                  Add More Contact Person
                </Button>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <Field label="Target Market" full>
                <Input
                  placeholder="e.g. Inbound / Outbound"
                  value={form.targetMarket}
                  onChange={(e) => set("targetMarket", e.target.value)}
                />
              </Field>
              <Field label="What is your current sales channel? (website / physical location)" full>
                <Textarea
                  rows={2}
                  value={form.salesChannel}
                  onChange={(e) => set("salesChannel", e.target.value)}
                />
              </Field>
              <Checkbox
                label="I have read and agree to the Privacy Policy & Terms and Conditions"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
            </div>
          ) : null}

          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={back}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Save and Next</Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

const Field = ({
  label,
  full,
  children
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);
