import { configureStore } from "@reduxjs/toolkit";
import invoiceReducer from "./invoiceSlice.jsx";
import alertReducer from "./alertSlice.jsx";
import dmReducer from "./dmSlice";
import groupReducer from "./groupSlice";
import channelReducer from "./channelSlice";
import modelsReducer from "./modelsSlice";
import authReducer from "./authSlice.jsx";
import questionsUiReducer from "./questionsUiSlice.jsx";
import captionReducer from "./captionSlice.jsx";
import personaReducer from "./personaSlice.jsx";
import profileReducer from "./profileSlice.jsx";


const store = configureStore({
  reducer: {
    auth: authReducer,
    invoice: invoiceReducer,
    alert: alertReducer,
    dm: dmReducer,
    group: groupReducer,
    channel: channelReducer,
    models: modelsReducer,
    questionsUi: questionsUiReducer,
    caption: captionReducer,
    persona: personaReducer,
    profile: profileReducer,
  },
});

export default store;
