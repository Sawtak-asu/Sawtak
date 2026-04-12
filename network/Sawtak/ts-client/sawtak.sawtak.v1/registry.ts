import { GeneratedType } from "@cosmjs/proto-signing";
import { MsgUpdateParams } from "./types/sawtak/sawtak/v1/tx";
import { MsgSubmitIdentifiedComplaint } from "./types/sawtak/sawtak/v1/tx";
import { MsgSubmitAnonymousComplaint } from "./types/sawtak/sawtak/v1/tx";
import { MsgUpdateComplaintStatus } from "./types/sawtak/sawtak/v1/tx";

const msgTypes: Array<[string, GeneratedType]>  = [
    ["/sawtak.sawtak.v1.MsgUpdateParams", MsgUpdateParams],
    ["/sawtak.sawtak.v1.MsgSubmitIdentifiedComplaint", MsgSubmitIdentifiedComplaint],
    ["/sawtak.sawtak.v1.MsgSubmitAnonymousComplaint", MsgSubmitAnonymousComplaint],
    ["/sawtak.sawtak.v1.MsgUpdateComplaintStatus", MsgUpdateComplaintStatus],
    
];

export { msgTypes }