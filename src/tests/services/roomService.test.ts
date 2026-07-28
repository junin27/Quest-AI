import { describe, it, expect, vi, afterEach } from 'vitest';
import { RoomService } from '../../services/roomService';

// Mock getAuthHeader
vi.mock('../../lib/authHeader', () => ({
  getAuthHeader: vi.fn().mockResolvedValue({ Authorization: 'Bearer mock-token' }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe('RoomService', () => {
  it('deve gerenciar o cache de salas locais no localStorage', () => {
    const service = new RoomService();
    
    // Inicialmente o cache deve ser nulo
    expect(service.getCachedUserRooms()).toBeNull();

    const mockRooms = [
      {
        id: 'room-1',
        code: 'ABCDEF',
        ownerId: 'owner-1',
        maxGuests: 50,
        activeQuizId: null,
        createdAt: '2026-07-16T00:00:00Z',
        expiresAt: '2026-07-23T00:00:00Z',
      },
    ];

    service.setCachedUserRooms(mockRooms);
    expect(service.getCachedUserRooms()).toEqual(mockRooms);

    service.clearCache();
    expect(service.getCachedUserRooms()).toBeNull();
  });

  it('deve chamar /api/rooms/create ao criar uma sala com nome opcional', async () => {
    const service = new RoomService();
    const mockRoom = { id: 'new-room-id', code: 'XYZ987', name: 'Sala do Dev' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    });

    const room = await service.createRoom('Sala do Dev');

    expect(mockFetch).toHaveBeenCalledWith('/api/rooms/create', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      }),
      body: JSON.stringify({ name: 'Sala do Dev' }),
    }));
    expect(room).toEqual(mockRoom);
    // Deve atualizar o cache
    expect(service.getCachedUserRooms()).toContainEqual(mockRoom);
  });

  it('deve chamar /api/rooms/update ao alterar o nome da sala', async () => {
    const service = new RoomService();
    
    // Inserir salas no cache
    const initialRooms = [
      { id: 'room-1', code: '123456', name: 'Nome Antigo', ownerId: 'owner-1', maxGuests: 50, activeQuizId: null, createdAt: '2026-07-16T00:00:00Z', expiresAt: '2026-07-23T00:00:00Z' }
    ];
    service.setCachedUserRooms(initialRooms);

    const mockUpdatedRoom = { id: 'room-1', code: '123456', name: 'Nome Novo', ownerId: 'owner-1', maxGuests: 50, activeQuizId: null, createdAt: '2026-07-16T00:00:00Z', expiresAt: '2026-07-23T00:00:00Z' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUpdatedRoom),
    });

    const room = await service.updateRoomName('room-1', 'Nome Novo');

    expect(mockFetch).toHaveBeenCalledWith('/api/rooms/update', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      }),
      body: JSON.stringify({ roomId: 'room-1', name: 'Nome Novo' }),
    }));
    
    expect(room).toEqual(mockUpdatedRoom);
    // Deve atualizar no cache
    expect(service.getCachedUserRooms()).toContainEqual(mockUpdatedRoom);
  });

  it('deve chamar /api/rooms/join ao entrar em uma sala', async () => {
    const service = new RoomService();
    const mockRoom = { id: 'joined-room-id', code: 'JOIN12' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    });

    const room = await service.joinRoom('JOIN12');

    expect(mockFetch).toHaveBeenCalledWith('/api/rooms/join', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ code: 'JOIN12' }),
    }));
    expect(room).toEqual(mockRoom);
  });

  it('deve chamar /api/rooms/members com a ação ready no updateMemberReady', async () => {
    const service = new RoomService();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // Chama o método que vamos implementar em seguida
    await service.updateMemberReady('room-id-123', 'user-id-456', true);

    expect(mockFetch).toHaveBeenCalledWith('/api/rooms/members', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        action: 'ready',
        roomId: 'room-id-123',
        targetUserId: 'user-id-456',
        isReady: true,
      }),
    }));
  });

  it('deve lançar erro se a chamada de updateMemberReady falhar', async () => {
    const service = new RoomService();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Erro ao marcar pronto.' }),
    });

    await expect(
      service.updateMemberReady('room-id-123', 'user-id-456', true)
    ).rejects.toThrow('Erro ao marcar pronto.');
  });
});
