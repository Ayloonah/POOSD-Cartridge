import React, {
  useState,
  useEffect,
  useContext,
  useMemo
} from 'react';

import Button from './Button';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';

function getEntryId(entry) {
  return (
    entry?._id?.toString() ||
    entry?.entryId?.toString() ||
    ''
  );
}

function getGameObject(entry) {
  return entry?.gameId &&
    typeof entry.gameId === 'object'
    ? entry.gameId
    : null;
}

function getGameId(entry) {
  const game = getGameObject(entry);

  if (game?._id) {
    return game._id.toString();
  }

  if (
    entry?.gameId &&
    typeof entry.gameId !== 'object'
  ) {
    return entry.gameId.toString();
  }

  return '';
}

function getGameTitle(entry) {
  const game = getGameObject(entry);

  return (
    game?.name ||
    entry?.name ||
    'Unknown Game'
  );
}

function getCoverImage(entry) {
  const game = getGameObject(entry);

  return (
    game?.coverImage ||
    entry?.coverImage ||
    null
  );
}

function getEntryListIds(entry) {
  if (!Array.isArray(entry?.listIds)) {
    return [];
  }

  return entry.listIds
    .map((listId) => {
      if (
        listId &&
        typeof listId === 'object'
      ) {
        return listId._id?.toString();
      }

      return listId?.toString();
    })
    .filter(Boolean);
}

function getEntryCreatedTime(entry) {
  const value =
    entry?.createdAt ||
    entry?.dateAdded ||
    0;

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

export default function EditListModal({
  isOpen,
  list,
  onClose,
  onListUpdated,
  onListDeleted
}) {
  const { token } = useContext(AuthContext);

  const currentToken =
    token || localStorage.getItem('token');

  const [name, setName] = useState('');

  const [userEntries, setUserEntries] =
    useState([]);

  const [
    originalSelectedGameIds,
    setOriginalSelectedGameIds
  ] = useState([]);

  const [
    selectedGameIds,
    setSelectedGameIds
  ] = useState([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [
    showDeleteConfirmation,
    setShowDeleteConfirmation
  ] = useState(false);

  const [error, setError] = useState('');

  const listId = list?._id?.toString() || '';

  /*
   * Load the collection every time the modal opens.
   *
   * Membership is determined by checking whether each
   * collection entry contains this list ID in listIds.
   */
  useEffect(() => {
    if (!isOpen || !list || !currentToken) {
      return;
    }

    let isCancelled = false;

    const loadCollection = async () => {
      try {
        setIsLoading(true);
        setError('');
        setName(list.name || '');
        setShowDeleteConfirmation(false);

        const response = await api.get(
          '/user-game-entries/collection',
          currentToken
        );

        const responseData = await response
          .json()
          .catch(() => []);

        if (!response.ok) {
          throw new Error(
            responseData.error ||
              responseData.message ||
              'Failed to load your collection.'
          );
        }

        const entries = Array.isArray(responseData)
          ? responseData
          : [];

        const currentMembership = entries
          .filter((entry) =>
            getEntryListIds(entry).includes(listId)
          )
          .map(getGameId)
          .filter(Boolean);

        if (!isCancelled) {
          setUserEntries(entries);
          setOriginalSelectedGameIds(
            currentMembership
          );
          setSelectedGameIds(
            currentMembership
          );
        }
      } catch (loadError) {
        console.error(
          'Failed to load collection for list editing:',
          loadError
        );

        if (!isCancelled) {
          setError(
            loadError.message ||
              'Failed to load your collection.'
          );

          setUserEntries([]);
          setOriginalSelectedGameIds([]);
          setSelectedGameIds([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCollection();

    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    list,
    listId,
    currentToken
  ]);

  /*
   * Sort the collection newest first.
   */
  const sortedEntries = useMemo(() => {
    return [...userEntries].sort(
      (entryA, entryB) =>
        getEntryCreatedTime(entryB) -
        getEntryCreatedTime(entryA)
    );
  }, [userEntries]);

  /*
   * Collection entries currently selected for this list.
   */
  const selectedEntries = useMemo(() => {
    const selectedIds = new Set(
      selectedGameIds
    );

    return sortedEntries.filter((entry) =>
      selectedIds.has(getGameId(entry))
    );
  }, [
    sortedEntries,
    selectedGameIds
  ]);

  /*
   * Up to four images for the visual preview.
   */
  const selectedCoverImages = useMemo(() => {
    return selectedEntries
      .map(getCoverImage)
      .filter(Boolean)
      .slice(0, 4);
  }, [selectedEntries]);

  /*
   * The API stores one coverImage string.
   *
   * Save the newest selected game's cover as the
   * representative list cover.
   */
  const generatedCoverImage =
    selectedCoverImages[0] || null;

  const trimmedName = name.trim();

  const membershipChanged = useMemo(() => {
    if (
      selectedGameIds.length !==
      originalSelectedGameIds.length
    ) {
      return true;
    }

    const originalSet = new Set(
      originalSelectedGameIds
    );

    return selectedGameIds.some(
      (gameId) => !originalSet.has(gameId)
    );
  }, [
    selectedGameIds,
    originalSelectedGameIds
  ]);

  const nameChanged =
    trimmedName !==
    (list?.name?.trim() || '');

  const coverChanged =
    generatedCoverImage !==
    (list?.coverImage || null);

  const hasChanges =
    nameChanged ||
    membershipChanged ||
    coverChanged;

  const isBusy =
    isSaving ||
    isDeleting ||
    isLoading;

  const handleToggleGame = (
    gameId,
    checked
  ) => {
    if (!gameId) {
      return;
    }

    setSelectedGameIds((currentIds) => {
      if (checked) {
        if (currentIds.includes(gameId)) {
          return currentIds;
        }

        return [...currentIds, gameId];
      }

      return currentIds.filter(
        (currentId) =>
          currentId !== gameId
      );
    });

    setError('');
  };

  const handleClose = () => {
    if (isSaving || isDeleting) {
      return;
    }

    setError('');
    setShowDeleteConfirmation(false);
    onClose();
  };

  const handleSave = async () => {
    if (!listId) {
      setError(
        'This list does not have a valid ID.'
      );
      return;
    }

    if (!trimmedName) {
      setError(
        'A list name is required.'
      );
      return;
    }

    if (!hasChanges) {
      handleClose();
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const originalSet = new Set(
        originalSelectedGameIds
      );

      const selectedSet = new Set(
        selectedGameIds
      );

      const gameIdsToAdd =
        selectedGameIds.filter(
          (gameId) =>
            !originalSet.has(gameId)
        );

      const gameIdsToRemove =
        originalSelectedGameIds.filter(
          (gameId) =>
            !selectedSet.has(gameId)
        );

      /*
       * First update game membership.
       *
       * Each membership endpoint expects the actual
       * Game document ID, not the UserGameEntry ID.
       */
      const addRequests = gameIdsToAdd.map(
        async (gameId) => {
          const response = await api.post(
            `/user-game-entries/lists/${listId}/games/${gameId}`,
            {},
            currentToken
          );

          const responseData = await response
            .json()
            .catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              responseData.error ||
                responseData.message ||
                `Failed to add ${getTitleByGameId(
                  gameId
                )} to the list.`
            );
          }

          return responseData;
        }
      );

      const removeRequests =
        gameIdsToRemove.map(
          async (gameId) => {
            const response = await api.delete(
              `/user-game-entries/lists/${listId}/games/${gameId}`,
              currentToken
            );

            const responseData =
              await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
              throw new Error(
                responseData.error ||
                  responseData.message ||
                  `Failed to remove ${getTitleByGameId(
                    gameId
                  )} from the list.`
              );
            }

            return responseData;
          }
        );

      /*
       * Run membership requests in parallel.
       */
      await Promise.all([
        ...addRequests,
        ...removeRequests
      ]);

      /*
       * Then save the name and generated cover.
       *
       * At least one of these fields must be included
       * because the list update endpoint rejects an
       * empty update object.
       */
      const updatePayload = {};

      if (nameChanged) {
        updatePayload.name = trimmedName;
      }

      if (coverChanged || membershipChanged) {
        updatePayload.coverImage =
            generatedCoverImage;
        }

      let updatedList = {
        ...list,
        name: trimmedName,
        coverImage: generatedCoverImage
      };

      if (
        Object.keys(updatePayload).length > 0
      ) {
        const listResponse = await api.patch(
          `/lists/${listId}`,
          updatePayload,
          currentToken
        );

        const listResponseData =
          await listResponse
            .json()
            .catch(() => ({}));

        if (!listResponse.ok) {
          throw new Error(
            listResponseData.error ||
              listResponseData.message ||
              'Game membership changed, but the list details could not be updated.'
          );
        }

        updatedList =
          listResponseData.list ||
          updatedList;
      }

      setOriginalSelectedGameIds(
        selectedGameIds
      );

      if (onListUpdated) {
        onListUpdated(updatedList);
      }

      onClose();
    } catch (saveError) {
      console.error(
        'Failed to save list changes:',
        saveError
      );

      setError(
        saveError.message ||
          'Failed to save list changes.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!listId) {
      setError(
        'This list does not have a valid ID.'
      );
      return;
    }

    try {
      setIsDeleting(true);
      setError('');

      const response = await api.delete(
        `/lists/${listId}`,
        currentToken
      );

      const responseData = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            responseData.message ||
            'Failed to delete list.'
        );
      }

      if (onListDeleted) {
        onListDeleted(listId);
      }

      onClose();
    } catch (deleteError) {
      console.error(
        'Failed to delete list:',
        deleteError
      );

      setError(
        deleteError.message ||
          'Failed to delete list.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getTitleByGameId = (gameId) => {
    const matchingEntry =
      userEntries.find(
        (entry) =>
          getGameId(entry) === gameId
      );

    return matchingEntry
      ? getGameTitle(matchingEntry)
      : 'game';
  };

  if (!isOpen || !list) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-list-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        padding: '20px',
        backgroundColor:
          'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 130
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          border: '4px solid #143910',
          borderRadius: '16px',
          boxShadow:
            '0 12px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom:
              '2px solid #E5E7EB',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <h2
            id="edit-list-title"
            className="font-vt323"
            style={{
              margin: 0,
              color: '#143910',
              fontSize: '30px',
              letterSpacing: '1px'
            }}
          >
            Edit List
          </h2>

          <button
            type="button"
            onClick={handleClose}
            disabled={
              isSaving ||
              isDeleting
            }
            aria-label="Close edit list modal"
            style={{
              padding: '4px 8px',
              background: 'none',
              color: '#143910',
              fontSize: '20px',
              fontWeight: '700',
              opacity:
                isSaving || isDeleting
                  ? 0.5
                  : 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: '24px 32px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {error && (
            <div
              role="alert"
              style={{
                padding: '12px 14px',
                border:
                  '1px solid #FCA5A5',
                borderRadius: '6px',
                backgroundColor:
                  '#FEF2F2',
                color: '#B91C1C',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {error}
            </div>
          )}

          {/* List name */}
          <div>
            <label
              htmlFor="edit-list-name"
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#143910',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              List Name *
            </label>

            <input
              id="edit-list-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              disabled={isBusy}
              maxLength={100}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border:
                  '2px solid #143910',
                borderRadius: '5px',
                backgroundColor: isBusy
                  ? '#F3F4F6'
                  : '#FFFFFF',
                color: '#111827',
                fontFamily: 'Inter',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Generated cover preview */}
          <div>
            <span
              style={{
                display: 'block',
                marginBottom: '6px',
                color: '#143910',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              Cover Preview
            </span>

            <div
              style={{
                width: '100%',
                height: '150px',
                padding: '2px',
                border:
                  '2px solid #143910',
                borderRadius: '8px',
                backgroundColor:
                  '#EBE5F0',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns:
                  selectedCoverImages.length >
                  1
                    ? 'repeat(2, 1fr)'
                    : '1fr',
                gridTemplateRows:
                  selectedCoverImages.length >
                  2
                    ? 'repeat(2, 1fr)'
                    : '1fr',
                gap: '2px'
              }}
            >
              {selectedCoverImages.length >
              0 ? (
                selectedCoverImages.map(
                  (imageUrl, index) => (
                    <img
                      key={`${imageUrl}-${index}`}
                      src={imageUrl}
                      alt="List cover preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: 0,
                        objectFit: 'cover'
                      }}
                    />
                  )
                )
              ) : (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    gridRow: '1 / -1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent:
                      'center',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#6B7280',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}
                >
                  <span
                    style={{
                      fontSize: '30px'
                    }}
                  >
                    🎮
                  </span>

                  Select games to generate a cover
                </div>
              )}
            </div>

            <p
              style={{
                margin: '7px 0 0 0',
                color: '#6B7280',
                fontSize: '11px',
                lineHeight: 1.4
              }}
            >
              The collage is shown as a preview. The
              newest selected game cover is saved as the
              list cover.
            </p>
          </div>

          {/* Membership selector */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '7px'
              }}
            >
              <label
                style={{
                  color: '#143910',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                Games in This List
              </label>

              <span
                style={{
                  color: '#6B7280',
                  fontSize: '11px'
                }}
              >
                {selectedGameIds.length}{' '}
                selected
              </span>
            </div>

            <div
              style={{
                maxHeight: '220px',
                padding: '10px',
                border:
                  '2px solid #143910',
                borderRadius: '6px',
                backgroundColor:
                  '#F9FAFB',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '7px'
              }}
            >
              {isLoading ? (
                <span
                  style={{
                    padding: '16px',
                    color: '#6B7280',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}
                >
                  Loading collection...
                </span>
              ) : sortedEntries.length ===
                0 ? (
                <span
                  style={{
                    padding: '16px',
                    color: '#6B7280',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}
                >
                  No games in your collection yet.
                </span>
              ) : (
                sortedEntries.map((entry) => {
                  const gameId =
                    getGameId(entry);

                  const title =
                    getGameTitle(entry);

                  const cover =
                    getCoverImage(entry);

                  const isChecked =
                    selectedGameIds.includes(
                      gameId
                    );

                  return (
                    <label
                      key={
                        getEntryId(entry) ||
                        gameId
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '7px',
                        borderRadius: '5px',
                        backgroundColor:
                          isChecked
                            ? '#F0F7D6'
                            : '#FFFFFF',
                        color: '#111827',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={
                          isSaving ||
                          isDeleting
                        }
                        onChange={(event) =>
                          handleToggleGame(
                            gameId,
                            event.target
                              .checked
                          )
                        }
                        style={{
                          width: '16px',
                          height: '16px',
                          flexShrink: 0
                        }}
                      />

                      <div
                        style={{
                          width: '34px',
                          height: '46px',
                          borderRadius: '4px',
                          backgroundColor:
                            '#E5E7EB',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            'center'
                        }}
                      >
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit:
                                'cover'
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: '16px'
                            }}
                          >
                            🎮
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          minWidth: 0,
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow:
                            'ellipsis'
                        }}
                        title={title}
                      >
                        {title}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Delete area */}
          <div
            style={{
              marginTop: '4px',
              paddingTop: '20px',
              borderTop:
                '2px solid #E5E7EB'
            }}
          >
            {!showDeleteConfirmation ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div>
                  <h3
                    style={{
                      margin:
                        '0 0 4px 0',
                      color: '#991B1B',
                      fontSize: '14px'
                    }}
                  >
                    Delete List
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: '#6B7280',
                      fontSize: '12px',
                      lineHeight: 1.4
                    }}
                  >
                    Games will remain in your
                    collection.
                  </p>
                </div>

                <Button
                  variant="danger"
                  onClick={() =>
                    setShowDeleteConfirmation(
                      true
                    )
                  }
                  disabled={isBusy}
                  style={{
                    flexShrink: 0,
                    padding: '8px 12px'
                  }}
                >
                  Delete
                </Button>
              </div>
            ) : (
              <div
                style={{
                  padding: '14px',
                  border:
                    '1px solid #FCA5A5',
                  borderRadius: '8px',
                  backgroundColor:
                    '#FEF2F2'
                }}
              >
                <p
                  style={{
                    margin:
                      '0 0 8px 0',
                    color: '#991B1B',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  Delete “{list.name}”?
                </p>

                <p
                  style={{
                    margin:
                      '0 0 14px 0',
                    color: '#7F1D1D',
                    fontSize: '12px',
                    lineHeight: 1.4
                  }}
                >
                  This cannot be undone. The games
                  will remain in your collection.
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'flex-end',
                    gap: '8px'
                  }}
                >
                  <Button
                    variant="tertiary"
                    onClick={() =>
                      setShowDeleteConfirmation(
                        false
                      )
                    }
                    disabled={isBusy}
                    style={{
                      padding: '8px 12px'
                    }}
                  >
                    Keep List
                  </Button>

                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={isBusy}
                    style={{
                      padding: '8px 12px'
                    }}
                  >
                    {isDeleting
                      ? 'Deleting...'
                      : 'Yes, Delete'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 32px',
            borderTop:
              '2px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <Button
            variant="tertiary"
            onClick={handleClose}
            disabled={
              isSaving ||
              isDeleting
            }
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={
              isBusy ||
              !trimmedName ||
              !hasChanges
            }
          >
            {isSaving
              ? 'Saving...'
              : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}