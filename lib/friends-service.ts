// Friends service for managing friend aliases and attributes
import { apiClient, API_CONFIG } from "./api-config"

export interface UpdateAliasRequest {
  FromUserId: string
  UserIds: Array<{
    UserId: string
    FriendAlias: string
  }>
}

export interface FriendAttribute {
  Key: string
  Value: string
}

export interface UpdateAttributesRequest {
  FromUserId: string
  UserId: string
  Attributes: FriendAttribute[]
}

export class FriendsService {
  // Update friend alias(es)
  async updateAlias(request: UpdateAliasRequest): Promise<void> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.FRIENDS_UPDATE_ALIAS, request)
    } catch (error: any) {
      // Only log if backend was previously available
      const { connectionStatus } = await import("./connection-status")
      if (connectionStatus.shouldLogError() && error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to update friend alias:", error)
      }
      throw error
    }
  }

  // Update friend attributes
  async updateAttributes(request: UpdateAttributesRequest): Promise<void> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.FRIENDS_UPDATE_ATTRIBUTES, request)
    } catch (error: any) {
      // Only log if backend was previously available
      const { connectionStatus } = await import("./connection-status")
      if (connectionStatus.shouldLogError() && error.message !== "BACKEND_UNAVAILABLE") {
        console.error("Failed to update friend attributes:", error)
      }
      throw error
    }
  }
}

export const friendsService = new FriendsService()

