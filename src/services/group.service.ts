import { GroupRepository } from "../repositories/group.repository";
import { IGroup } from '../models/Group';
import { NotFoundError } from "../utils/customError";
import { UpdateGroupInfoDto } from "../dtos/group.dto";

export class GroupService {
  // static methods are defined so that the class can be used with functional programming
  public static async updateGroupInfo(groupId: string, updateGroupInfoDto: UpdateGroupInfoDto ): Promise<IGroup> {
    const update = await GroupRepository.update(groupId, updateGroupInfoDto);
    if (!update) {
      throw new NotFoundError('Group not found');
    }
    return update
  }

}