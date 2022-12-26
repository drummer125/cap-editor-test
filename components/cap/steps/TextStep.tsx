import styles from "../../../styles/components/cap/Step.module.css";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Form,
  Input,
  SelectPicker,
  TagPicker,
} from "rsuite";
import { forwardRef, useEffect, useState } from "react";
import { camelise, classes } from "../../../lib/helpers";
import { AlertData, StepProps } from "../NewAlert";
import { WhatNowResponse } from "../../../lib/types/types";

const Textarea = forwardRef((props, ref) => (
  <Input {...props} ref={ref} rows={5} as="textarea" />
));
Textarea.displayName = "Textarea";

// CAP info.responseType
const ACTIONS = [
  "Shelter",
  "Evacuate",
  "Prepare",
  "Execute",
  "Avoid",
  "Monitor",
  "Assess",
  "All Clear",
  "None",
];

const getDefaultInstructionTypes = (urgency: string) => {
  const types = [];

  if (urgency === "Immediate") types.push("immediate");
  if (urgency === "Expected") types.push("watch");
  if (urgency === "Future") types.push("warning", "seasonalForecast");

  return types;
};

export default function TextStep({
  onUpdate,
  headline,
  description,
  instruction,
  actions,
  countryCode,
  urgency,
}: Partial<AlertData> & StepProps & { countryCode: string }) {
  const [numberOfUrls, setNumberOfUrls] = useState(1);
  const [whatNowMessages, setWhatNowMessages] = useState<WhatNowResponse[]>([]);
  const [chosenWhatNowMessage, setChosenWhatNowMessage] = useState<
    string | null
  >(null);
  const [chosenWhatNowInstructions, setChosenWhatNowInstructions] = useState(
    getDefaultInstructionTypes(urgency!)
  );

  useEffect(() => {
    fetch(`/api/whatnow?countryCode=${countryCode}`)
      .then((res) => res.json())
      .then((res) => setWhatNowMessages(res.data));
  }, []);

  useEffect(() => {
    if (chosenWhatNowMessage == null) {
      onUpdate({ description: "", instruction: "" });
      return;
    }

    const message = whatNowMessages.find((w) => w.id === chosenWhatNowMessage);
    if (!message) return;

    onUpdate({
      description: message.translations.en.description,
      instruction: Object.entries(message.translations.en.stages)
        .filter(
          ([type, strings]) =>
            chosenWhatNowInstructions.includes(type) && strings.length
        )
        .map(([type, strings], i) => `- ${strings.join("\n- ")}`)
        .join("\n\n"),
    });
  }, [chosenWhatNowMessage, chosenWhatNowInstructions]);

  return (
    <div>
      <Form fluid>
        <Form.Group>
          <Form.ControlLabel>Headline</Form.ControlLabel>
          <Form.Control
            name="headline"
            onChange={(headline) => onUpdate({ headline })}
            value={headline}
          />
          <Form.HelpText
            style={{ color: (headline?.length ?? 0) > 160 ? "red" : "unset" }}
          >
            {headline?.length ?? 0}/160 characters
          </Form.HelpText>
        </Form.Group>

        <Form.Group>
          <Form.ControlLabel>Description</Form.ControlLabel>
          {whatNowMessages.length && (
            <SelectPicker
              block
              placeholder="Choose event to auto-fill from WhatNow?"
              data={whatNowMessages.map((w) => ({
                label: w.eventType,
                value: w.id,
              }))}
              onChange={(v) => setChosenWhatNowMessage(v)}
            />
          )}
          <Form.Control
            accepter={Textarea}
            name="description"
            onChange={(description) => onUpdate({ description })}
            value={description}
          />
          {whatNowMessages.length && (
            <Form.HelpText>
              WhatNow provides pre-written messages and instructions you can use
              for certain events. Use the dropdown to select one of these as a
              template, or provide your own Description and Instructions.
            </Form.HelpText>
          )}
        </Form.Group>

        <Form.Group>
          <Form.ControlLabel>Instruction</Form.ControlLabel>
          {whatNowMessages.length && chosenWhatNowMessage && (
            <CheckboxGroup
              inline
              onChange={(v) => setChosenWhatNowInstructions(v as string[])}
              value={chosenWhatNowInstructions}
            >
              {[
                "Mitigation",
                "Seasonal Forecast",
                "Warning",
                "Watch",
                "Immediate",
                "Recover",
              ].map((t) => (
                <Checkbox key={`instruction-type-${t}`} value={camelise(t)}>
                  {t}
                </Checkbox>
              ))}
            </CheckboxGroup>
          )}
          <Form.Control
            accepter={Textarea}
            name="instruction"
            onChange={(instruction) => onUpdate({ instruction })}
            value={instruction}
          />
        </Form.Group>
      </Form>

      <h4>Recommended Actions</h4>
      <p>
        Choose the recommended actions for the audience of the alert, using the
        dropdown menu.
      </p>
      <TagPicker
        cleanable={false}
        color="green"
        appearance="default"
        block
        data={ACTIONS.map((a) => ({ label: a, value: a.replace(" ", "") }))}
        value={actions}
        onChange={(actions) => onUpdate({ actions })}
      />

      <h4>Link to external resources</h4>
      <p>
        If necessary, add links to resources that offer complementary,
        non-essential information to the alert.
      </p>
      {[...new Array(numberOfUrls)].map((_, n) => (
        <div key={`url-${n + 1}`} className={classes(styles.urlInputWrapper)}>
          <span>URL {n + 1}:</span>
          <Input type="url" />
        </div>
      ))}
      <Button>Add another URL?</Button>
    </div>
  );
}
