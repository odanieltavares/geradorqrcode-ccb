import { Template, PixData } from '../types';
import { replacePlaceholders } from './textUtils';

/**
 * Processes template bindings to create a PixData object suitable for payload generation.
 * @param template The template containing the bindings.
 * @param formData The raw data from the form.
 * @returns A PixData object with keys and values mapped according to the template's payload bindings.
 */
export const getPixDataFromForm = (template: Template, formData: PixData): PixData => {
  const payloadData: PixData = {};
  const bindings = template?.bindings?.payload;

  if (!bindings) {
    console.warn('Template is missing payload bindings.');
    return {};
  }

  for (const key in bindings) {
    if (Object.prototype.hasOwnProperty.call(bindings, key)) {
      const valueTemplate = bindings[key as keyof typeof bindings];
      // The value from bindings is a placeholder string like "{{name}}"
      // We resolve it using the formData
      payloadData[key as keyof PixData] = replacePlaceholders(valueTemplate, formData);
    }
  }
  
  return payloadData;
};