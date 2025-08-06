function validateInvoice(form) {
  const err = {};

  if (!form.client || form.client.trim().length < 2) {
    err.client = "Client name is required (min 2 chars)";
  }

  if (!form.campaign || form.campaign.trim().length < 2) {
    err.campaign = "Campaign name is required (min 2 chars)";
  }

  if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
    err.amount = "Amount must be a positive number";
  }

  if (!form.currency) {
    err.currency = "Currency is required";
  }

  if (!form.dueDate) {
    err.dueDate = "Due date is required";
  }

  if (!form.status) {
    err.status = "Status is required";
  }

  if (form.file && form.file.type !== "application/pdf") {
    err.file = "Only PDF files are allowed";
  }

  return {
    errMsg: err,
    errLength: Object.keys(err).length,
  };
}

export default validateInvoice;
