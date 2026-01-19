import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TimePicker from "./ui/time-picker";
import { calculateDurationMinutes, calculateEntryCosts } from "../lib/calculations";
import type { ArtDerKraefte, Tarife } from "../types/einsatz";
import { formatCurrency } from "../lib/utils";

const schema = z.object({
  bezeichnung: z.string().min(1, "Pflichtfeld").max(200),
  artDerKraefte: z.enum(["Personal", "Dienstkraftfahrzeug", "Luftfahrzeug"]),
  anzahl: z.number().int().min(1).max(999),
  datum: z.string().min(1, "Pflichtfeld"),
  beginn: z.string().min(1, "Pflichtfeld"),
  ende: z.string().min(1, "Pflichtfeld")
});

export type EinsatzFormValues = z.infer<typeof schema>;

interface EinsatzFormularProps {
  tarife: Tarife;
  initialValue?: Partial<EinsatzFormValues>;
  onSubmit: (values: EinsatzFormValues) => void;
  onCancelEdit?: () => void;
  onDraftChange?: (values: Partial<EinsatzFormValues>) => void;
  isEditing?: boolean;
}

const DEFAULT_VALUES: EinsatzFormValues = {
  bezeichnung: "",
  artDerKraefte: "Personal",
  anzahl: 1,
  datum: "",
  beginn: "",
  ende: ""
};

export default function EinsatzFormular({
  tarife,
  initialValue,
  onSubmit,
  onCancelEdit,
  onDraftChange,
  isEditing
}: EinsatzFormularProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors }
  } = useForm<EinsatzFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValue }
  });

  useEffect(() => {
    reset({ ...DEFAULT_VALUES, ...initialValue });
  }, [initialValue, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      onDraftChange?.(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDraftChange]);

  const values = watch();

  const preview = useMemo(() => {
    if (!values.datum || !values.beginn || !values.ende || !values.anzahl) {
      return null;
    }
    return calculateEntryCosts(
      values.artDerKraefte as ArtDerKraefte,
      values.anzahl,
      values.datum,
      values.beginn,
      values.ende,
      tarife
    );
  }, [values, tarife]);

  const duration = useMemo(() => {
    if (!values.beginn || !values.ende) {
      return null;
    }
    return calculateDurationMinutes(values.beginn, values.ende);
  }, [values.beginn, values.ende]);

  const midnightCrossing = useMemo(() => {
    if (!values.beginn || !values.ende) {
      return false;
    }
    const start = values.beginn;
    const end = values.ende;
    return start > end;
  }, [values.beginn, values.ende]);

  return (
    <section className="card">
      <h2>Einsatz erfassen</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid">
        <div className="grid">
          <div>
            <label htmlFor="bezeichnung">Bezeichnung der Kr&auml;fte</label>
            <input
              id="bezeichnung"
              {...register("bezeichnung")}
              maxLength={200}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-ms-editor="false"
            />
            {errors.bezeichnung && <small className="muted">{errors.bezeichnung.message}</small>}
          </div>
          <div className="grid grid-3">
            <div>
              <label htmlFor="art">Art der Kr&auml;fte</label>
              <select id="art" {...register("artDerKraefte")}>
                <option value="Personal">Personal</option>
                <option value="Dienstkraftfahrzeug">Dienstkraftfahrzeug</option>
                <option value="Luftfahrzeug">Luftfahrzeug</option>
              </select>
            </div>
            <div>
              <label htmlFor="anzahl">Anzahl</label>
              <input
                id="anzahl"
                type="number"
                min={1}
                max={999}
                {...register("anzahl", { valueAsNumber: true })}
                autoComplete="off"
                data-ms-editor="false"
              />
              {errors.anzahl && <small className="muted">{errors.anzahl.message}</small>}
            </div>
            <div>
              <label htmlFor="datum">Datum</label>
              <input
                id="datum"
                type="date"
                {...register("datum")}
                autoComplete="off"
                data-ms-editor="false"
              />
              {errors.datum && <small className="muted">{errors.datum.message}</small>}
            </div>
          </div>
          <div className="grid grid-3">
            <div>
              <label>Beginn</label>
              <Controller
                control={control}
                name="beginn"
                render={({ field }) => <TimePicker {...field} />}
              />
              {errors.beginn && <small className="muted">{errors.beginn.message}</small>}
            </div>
            <div>
              <label>Ende</label>
              <Controller
                control={control}
                name="ende"
                render={({ field }) => <TimePicker {...field} />}
              />
              {errors.ende && <small className="muted">{errors.ende.message}</small>}
            </div>
          </div>
        </div>

        <div className="summary">
          <div className="flex">
            <span className="tag">Live-Vorschau</span>
            {preview?.tarif2 ? <span className="tag tarif2">Tarif 2 aktiv</span> : null}
            {values.artDerKraefte === "Luftfahrzeug" ? (
              <span className="tag luft">Minutentarif</span>
            ) : null}
          </div>
          {preview ? (
            <div>
              <div>
                Halbstunden T1: {preview.tarif1} | Halbstunden T2: {preview.tarif2}
              </div>
              <div>Gesamtkosten: {formatCurrency(preview.gesamt)}</div>
              {duration !== null && <div>Dauer: {duration} Minuten</div>}
              {midnightCrossing && (
                <small className="muted">Mitternachts&uuml;bergang erkannt.</small>
              )}
            </div>
          ) : (
            <small className="muted">Bitte Felder ausf&uuml;llen f&uuml;r die Live-Vorschau.</small>
          )}
        </div>

        <div className="actions">
          <button type="submit">{isEditing ? "Speichern" : "Hinzuf\u00fcgen"}</button>
          <button type="button" className="secondary" onClick={() => reset(DEFAULT_VALUES)}>
            Zur&uuml;cksetzen
          </button>
          {onCancelEdit ? (
            <button type="button" className="ghost" onClick={onCancelEdit}>
              {isEditing ? "Abbrechen" : "Schlie\u00dfen"}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
