import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAPI } from '../../app/utils/api'
import * as authToken from '../../app/utils/auth-token'

describe('useAPI', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('$fetch', fetchMock)
    vi.spyOn(authToken, 'getAuthToken').mockReturnValue('mock-token')
    vi.spyOn(authToken, 'removeAuthToken').mockImplementation(() => undefined)
  })

  it('sends Authorization header with current token', async () => {
    fetchMock.mockResolvedValueOnce({ success: true })

    const result = await useAPI('/api/verify')
    expect(result).toEqual({ success: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/verify', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer mock-token',
        'X-Requested-With': 'XMLHttpRequest',
      }),
    }))
  })

  it('removes token and redirects on 401 for normal endpoints', async () => {
    const error = Object.assign(new Error('Unauthorized'), { status: 401 })
    fetchMock.mockRejectedValueOnce(error)

    await expect(useAPI('/api/link/list')).rejects.toThrow('Unauthorized')
    expect(authToken.removeAuthToken).toHaveBeenCalledOnce()
  })

  it('does NOT remove token or redirect on 401 for /api/stats/ endpoints', async () => {
    const error = Object.assign(new Error('Unauthorized'), { status: 401 })
    fetchMock.mockRejectedValueOnce(error)

    await expect(useAPI('/api/stats/counters')).rejects.toThrow('Unauthorized')
    expect(authToken.removeAuthToken).not.toHaveBeenCalled()
  })

  it('does NOT remove token or redirect on 401 for /api/logs/ endpoints', async () => {
    const error = Object.assign(new Error('Unauthorized'), { status: 401 })
    fetchMock.mockRejectedValueOnce(error)

    await expect(useAPI('/api/logs/locations')).rejects.toThrow('Unauthorized')
    expect(authToken.removeAuthToken).not.toHaveBeenCalled()
  })

  it('does NOT remove token or redirect on 401 when ignoreAuthRedirect is true', async () => {
    const error = Object.assign(new Error('Unauthorized'), { status: 401 })
    fetchMock.mockRejectedValueOnce(error)

    await expect(useAPI('/api/custom', { ignoreAuthRedirect: true })).rejects.toThrow('Unauthorized')
    expect(authToken.removeAuthToken).not.toHaveBeenCalled()
  })
})
