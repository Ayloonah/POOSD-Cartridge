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

function getGameTitle(entry) {
  const game = getGameObject(entry);

  return (
    game?.name ||
    entry?.name ||
    'Unknown Game'
  );
}

function getGameCover(entry) {
  const game = getGameObject(entry);

  return (
    game?.coverImage ||
    entry?.coverImage ||
    null
  );
}

function getEntryCreatedTime(entry) {
  const dateValue =
    entry?.createdAt ||
    entry?.dateAdded ||
    0;

  const time = new Date(dateValue).getTime();

  return Number.isNaN(time) ? 0 : time;
}

export default function CreateListModal({
  isOpen,
  onClose,
  onListCreated,
  onOpenAddGameModal,
  prefilledName = '',
  prefilledSelectedIds = [],
  onStateChange
}) {
  const { token } = useContext(AuthContext);

  const currentToken =
    token || localStorage.getItem('token');

  const [name, setName] = useState('');
  const [userEntries, setUserEntries] =
    useState([]);

  const [
    selectedEntryIds,
    setSelectedEntryIds
  ] = useState([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState('');

  /*
   * Load the user's collection and restore any temporary
   * list-creation state supplied by the parent.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;

    const loadCollection = async () => {
      try {
        setName(prefilledName || '');

        setSelectedEntryIds(
          Array.isArray(prefilledSelectedIds)
            ? prefilledSelectedIds
                .map((id) => id?.toString())
                .filter(Boolean)
            : []
        );

        setIsLoading(true);
        setError('');

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

        if (!isCancelled) {
          setUserEntries(entries);
        }
      } catch (loadError) {
        console.error(
          'Failed to load collection games for list creation:',
          loadError
        );

        if (!isCancelled) {
          setUserEntries([]);

          setError(
            loadError.message ||
              'Failed to load your collection.'
          );
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
    currentToken,
    prefilledName,
    prefilledSelectedIds
  ]);

  /*
   * Always display the collection newest first.
   */
  const sortedEntries = useMemo(() => {
    return [...userEntries].sort(
      (entryA, entryB) =>
        getEntryCreatedTime(entryB) -
        getEntryCreatedTime(entryA)
    );
  }, [userEntries]);

  /*
   * Selected entries remain in newest-to-oldest order.
   */
  const selectedEntries = useMemo(() => {
    const selectedIdSet = new Set(
      selectedEntryIds
    );

    return sortedEntries.filter((entry) =>
      selectedIdSet.has(getEntryId(entry))
    );
  }, [
    sortedEntries,
    selectedEntryIds
  ]);

  /*
   * These images create the four-tile visual preview.
   */
  const selectedCovers = useMemo(() => {
    return selectedEntries
      .map(getGameCover)
      .filter(Boolean)
      .slice(0, 4);
  }, [selectedEntries]);

  /*
   * The current API stores one coverImage URL, not the
   * complete collage. Save the newest selected game cover
   * as the representative list cover.
   */
  const savedCoverImage =
    selectedCovers[0] || null;

  /*
   * Create four stable preview positions so one, two, or
   * three selected covers do not produce a strange grid.
   */
  const previewTiles = useMemo(() => {
    return Array.from(
      { length: 4 },
      (_, index) => selectedCovers[index] || null
    );
  }, [selectedCovers]);

  if (!isOpen) {
    return null;
  }

  const notifyParentState = (
    updatedName,
    updatedIds
  ) => {
    if (onStateChange) {
      onStateChange(
        updatedName,
        updatedIds
      );
    }
  };

  const handleNameChange = (event) => {
    const updatedName = event.target.value;

    setName(updatedName);
    setError('');

    notifyParentState(
      updatedName,
      selectedEntryIds
    );
  };

  const handleToggleEntry = (
    entryId,
    checked
  ) => {
    if (!entryId) {
      return;
    }

    setSelectedEntryIds((currentIds) => {
      let updatedIds;

      if (checked) {
        updatedIds = currentIds.includes(entryId)
          ? currentIds
          : [...currentIds, entryId];
      } else {
        updatedIds = currentIds.filter(
          (id) => id !== entryId
        );
      }

      notifyParentState(name, updatedIds);

      return updatedIds;
    });

    setError('');
  };

  const handleOpenAddGame = () => {
    /*
     * Ensure the parent has the newest form state before
     * this modal closes and AddGameModal opens.
     */
    notifyParentState(
      name,
      selectedEntryIds
    );

    if (onOpenAddGameModal) {
      onOpenAddGameModal();
    }
  };

  const handleCreateList = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('A list name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        name: trimmedName,
        isPublic: false,
        coverImage: savedCoverImage,
        entryIds: selectedEntryIds
      };

      const response = await api.post(
        '/lists',
        payload,
        currentToken
      );

      const responseData = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            responseData.message ||
            'Failed to create list.'
        );
      }

      if (onListCreated) {
        onListCreated(
          responseData.list,
          responseData.assignedEntryIds || []
        );
      }

      onClose();
    } catch (createError) {
      console.error(
        'Failed to create list:',
        createError
      );

      setError(
        createError.message ||
          'Failed to create list.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy =
    isLoading || isSubmitting;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-list-title"
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
        zIndex: 120
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
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
            id="create-list-title"
            className="font-vt323"
            style={{
              margin: 0,
              color: '#143910',
              fontSize: '30px',
              letterSpacing: '1px'
            }}
          >
            Create New List
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close create list modal"
            style={{
              padding: '4px 8px',
              background: 'none',
              color: '#143910',
              fontSize: '20px',
              fontWeight: '700',
              opacity: isSubmitting
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
            gap: '18px'
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
              htmlFor="new-list-name"
              style={{
                display: 'block',
                marginBottom: '5px',
                color: '#143910',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              List Name *
            </label>

            <input
              id="new-list-name"
              type="text"
              placeholder="e.g. Favorite RPGs"
              value={name}
              onChange={handleNameChange}
              disabled={isSubmitting}
              maxLength={100}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border:
                  '2px solid #143910',
                borderRadius: '5px',
                backgroundColor:
                  isSubmitting
                    ? '#F3F4F6'
                    : '#FFFFFF',
                color: '#111827',
                fontFamily: 'Inter',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Cover preview */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '6px'
              }}
            >
              <span
                style={{
                  color: '#143910',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                Cover Preview
              </span>

              <span
                style={{
                  color: '#6B7280',
                  fontSize: '11px'
                }}
              >
                Auto-generated
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '160px',
                padding: '3px',
                border:
                  '2px solid #143910',
                borderRadius: '8px',
                backgroundColor:
                  '#EBE5F0',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gridTemplateRows:
                  'repeat(2, minmax(0, 1fr))',
                gap: '3px'
              }}
            >
              {previewTiles.map(
                (imageUrl, index) => (
                  <div
                    key={index}
                    style={{
                      minWidth: 0,
                      minHeight: 0,
                      borderRadius: '4px',
                      backgroundColor:
                        '#D8D0DE',
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent:
                        'center',
                      alignItems: 'center'
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`Selected game cover ${
                          index + 1
                        }`}
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'block',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: '#8B8491',
                          fontSize: '22px',
                          opacity: 0.6
                        }}
                      >
                        🎮
                      </span>
                    )}
                  </div>
                )
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
              The newest selected game cover will be
              saved as the list cover.
            </p>
          </div>

          {/* Collection selector */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <label
                style={{
                  color: '#143910',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                Add Games from Collection
              </label>

              <button
                type="button"
                onClick={handleOpenAddGame}
                disabled={isSubmitting}
                style={{
                  padding: 0,
                  background: 'none',
                  color: '#2E7D32',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'underline',
                  opacity: isSubmitting
                    ? 0.5
                    : 1
                }}
              >
                + Add game to collection
              </button>
            </div>

            <div
              style={{
                maxHeight: '210px',
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
                    padding: '14px',
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
                    padding: '14px',
                    color: '#6B7280',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}
                >
                  No games in your collection yet.
                </span>
              ) : (
                sortedEntries.map((entry) => {
                  const entryId =
                    getEntryId(entry);

                  const gameTitle =
                    getGameTitle(entry);

                  const coverImage =
                    getGameCover(entry);

                  const isChecked =
                    selectedEntryIds.includes(
                      entryId
                    );

                  return (
                    <label
                      key={entryId}
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
                        disabled={isSubmitting}
                        onChange={(event) =>
                          handleToggleEntry(
                            entryId,
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
                          justifyContent:
                            'center',
                          alignItems: 'center'
                        }}
                      >
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit:
                                'cover'
                            }}
                          />
                        ) : (
                          <span>🎮</span>
                        )}
                      </div>

                      <span
                        title={gameTitle}
                        style={{
                          minWidth: 0,
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow:
                            'ellipsis'
                        }}
                      >
                        {gameTitle}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <span
              style={{
                color: '#6B7280',
                fontSize: '11px'
              }}
            >
              {selectedEntryIds.length}{' '}
              {selectedEntryIds.length === 1
                ? 'game selected'
                : 'games selected'}
            </span>
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
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleCreateList}
            disabled={
              !name.trim() ||
              isBusy
            }
          >
            {isSubmitting
              ? 'Creating...'
              : 'Create List'}
          </Button>
        </div>
      </div>
    </div>
  );
}