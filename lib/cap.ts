import { validate as validateJSON } from "jsonschema";
import { FormAlertData } from "../components/editor/EditorSinglePage";
import { formatDate } from "./helpers.client";
import { CAPV12JSONSchema, CAPV12Schema } from "./types/cap.schema";

export const mapFormAlertDataToCapSchema = (
  alertingAuthority: {
    name: string;
    author: string;
    contact: string | null;
    web: string | null;
  },
  alertData: FormAlertData,
  id: string
): CAPV12JSONSchema => {
  // Type as `any` for now because this object needs to next be validated against the JSON schema
  const alert: any = {
    identifier: id,
    sender: alertingAuthority.author,
    sent: formatDate(new Date(), alertData.timezone),
    status: alertData.status,
    msgType: alertData.msgType,
    // source
    scope: "Public",
    // restriction
    // addresses
    // code
    // note
    ...(alertData.references?.length && {
      references: alertData.references.join(" "),
    }),
    // incidents,
    info: [
      {
        language: alertData.language,
        category: alertData.category,
        event: alertData.event,
        responseType: alertData.responseType,
        urgency: alertData.urgency,
        severity: alertData.severity,
        certainty: alertData.certainty,
        // audience
        // eventCode
        // effective
        onset: alertData.onset,
        expires: alertData.expires,
        senderName: alertingAuthority.name,
        headline: alertData.headline,
        description: alertData.description,
        instruction: alertData.instruction,
        parameter: [
          {
            valueName: "CANONICAL_URL",
            value: `${process.env.BASE_URL}/feed/${id}`,
          },
        ],
        web: alertingAuthority.web ?? null,
        contact: alertingAuthority.contact ?? null,
        // parameter
        resource: alertData.resources,
        area: Object.entries(alertData.regions).map(([regionName, data]) => ({
          areaDesc: regionName,
          ...(data.polygons?.length && { polygon: data.polygons }),
          ...(data.circles?.length && { circle: data.circles }),
          geocode: Object.keys(data.geocodes ?? {}).map((valueName) => ({
            [valueName]: data.geocodes[valueName],
          })),
          // altitude
          // ceiling
        })),
      },
    ],
  };

  const validationResult = validateJSON(alert, CAPV12Schema);
  if (!validationResult.valid) {
    console.error(validationResult);
    throw "Invalid alert details";
  }

  return alert as CAPV12JSONSchema;
};
