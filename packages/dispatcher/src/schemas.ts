import { Static, Type } from "@sinclair/typebox";

export const PanelNameSchema = Type.String();
export type PanelNameType = Static<typeof PanelNameSchema>;

export const GroupNameSchema = Type.String();
export type GroupNameType = Static<typeof GroupNameSchema>;

export const GroupSchema = Type.Object({
    name: GroupNameSchema,
    panels: Type.Array(PanelNameSchema)
})
export type GroupType = Static<typeof GroupSchema>;

export const UpdatableGroupSchema = Type.Partial(GroupSchema);
export type UpdatableGroupType = Static<typeof UpdatableGroupSchema>;

export const GroupsSchema = Type.Array(GroupSchema);
export type GroupsType = Static<typeof GroupsSchema>;

export const PanelsSchema = Type.Array(PanelNameSchema);
export type PanelsType = Static<typeof PanelsSchema>;