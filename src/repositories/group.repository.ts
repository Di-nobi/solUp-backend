import Group, { IGroup } from '../models/Group';

export class GroupRepository {
  // static methods are defined so that the class can be used with functional programming
  public static async update(groupId: string, data: Partial<IGroup>): Promise<IGroup | null> {
    return await Group.findByIdAndUpdate(groupId, { ... data }, { new : true});
  }
}