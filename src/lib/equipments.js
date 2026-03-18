import axios from "axios";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return apiUrl.replace(/\/$/, "");
}

const API_URL = getApiUrl();

const api = axios.create({
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

function normalizeEquipment(row = {}) {
  return {
    __key: row?.id ?? crypto.randomUUID?.() ?? String(Math.random()),
    id: row?.id ?? null,
    itemId: row?.item_id ?? "",
    itemName: row?.item_name ?? "",
    equipmentTypeId: row?.equipment_type_id ?? null,
    jobOverrideMode: row?.job_override_mode ?? "inherit",
    craftLevel: row?.craft_level ?? null,
    equipLevel: row?.equip_level ?? null,
    recipeBook: row?.recipe_book ?? "",
    recipePlace: row?.recipe_place ?? "",
    description: row?.description ?? "",
    slot: row?.slot ?? "",
    slotGridType: row?.slot_grid_type ?? "",
    slotGridCols: row?.slot_grid_cols ?? null,
    groupKind: row?.group_kind ?? "",
    groupId: row?.group_id ?? "",
    groupName: row?.group_name ?? "",
    materialsJson: row?.materials_json ?? [],
    slotGridJson: row?.slot_grid_json ?? null,
    sourceUrl: row?.source_url ?? "",
    detailUrl: row?.detail_url ?? "",
    effectsJson: row?.effects_json ?? [],
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,

    equipmentType: row?.equipment_type
      ? {
          id: row.equipment_type.id ?? null,
          key: row.equipment_type.key ?? "",
          name: row.equipment_type.name ?? "",
          kind: row.equipment_type.kind ?? "",
          craftTypeId: row.equipment_type.craft_type_id ?? null,
          craftType: row.equipment_type.craft_type
            ? {
                id: row.equipment_type.craft_type.id ?? null,
                name: row.equipment_type.craft_type.name ?? "",
              }
            : null,
          equipableTypes: Array.isArray(row.equipment_type.equipable_types)
            ? row.equipment_type.equipable_types.map((et) => ({
                id: et?.id ?? null,
                gameJobId: et?.game_job_id ?? null,
                equipmentTypeId: et?.equipment_type_id ?? null,
                gameJob: et?.game_job
                  ? {
                      id: et.game_job.id ?? null,
                      name: et.game_job.name ?? "",
                      key: et.game_job.key ?? "",
                    }
                  : null,
              }))
            : [],
        }
      : null,
  };
}

function toApiPayload(data = {}) {
  return {
    item_id: data?.itemId ?? "",
    item_name: data?.itemName ?? "",
    equipment_type_id:
      data?.equipmentTypeId === "" || data?.equipmentTypeId == null
        ? null
        : Number(data.equipmentTypeId),
    job_override_mode: data?.jobOverrideMode || "inherit",
    override_jobs_json: Array.isArray(data?.overrideJobsJson)
      ? data.overrideJobsJson
      : [],
    craft_level:
      data?.craftLevel === "" || data?.craftLevel == null
        ? null
        : Number(data.craftLevel),
    equip_level:
      data?.equipLevel === "" || data?.equipLevel == null
        ? null
        : Number(data.equipLevel),
    recipe_book: data?.recipeBook ?? "",
    recipe_place: data?.recipePlace ?? "",
    description: data?.description ?? "",
    slot: data?.slot ?? "",
    slot_grid_type: data?.slotGridType ?? "",
    slot_grid_cols:
      data?.slotGridCols === "" || data?.slotGridCols == null
        ? null
        : Number(data.slotGridCols),
    group_kind: data?.groupKind ?? "",
    group_id: data?.groupId ?? "",
    group_name: data?.groupName ?? "",
    materials_json: Array.isArray(data?.materialsJson) ? data.materialsJson : [],
    slot_grid_json: data?.slotGridJson ?? null,
    source_url: data?.sourceUrl ?? "",
    detail_url: data?.detailUrl ?? "",
    effects_json: Array.isArray(data?.effectsJson) ? data.effectsJson : [],
  };
}

export async function fetchEquipments(params = {}) {
  try {
    const res = await api.get(`${API_URL}/api/equipments`, { params });
    const json = res.data;

    if (Array.isArray(json)) return json.map(normalizeEquipment);
    if (Array.isArray(json?.data)) return json.data.map(normalizeEquipment);
    if (Array.isArray(json?.data?.data)) {
      return json.data.data.map(normalizeEquipment);
    }

    return [];
  } catch (error) {
    console.error(error);
    throw new Error("装備一覧取得失敗");
  }
}

export async function fetchCraftTools() {
  try {
    return await fetchEquipments({
      group_kind: "craft_tool_set",
    });
  } catch (error) {
    console.error(error);
    throw new Error("職人道具一覧取得失敗");
  }
}

export async function fetchEquipment(id) {
  try {
    const res = await api.get(`${API_URL}/api/equipments/${id}`);
    const json = res.data;
    return normalizeEquipment(json?.data ?? json);
  } catch (error) {
    console.error(error);
    throw new Error("装備取得失敗");
  }
}

export async function createEquipment(data) {
  try {
    const res = await api.post(`${API_URL}/api/equipments`, toApiPayload(data));
    return normalizeEquipment(res.data?.data ?? res.data);
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("装備作成失敗");
  }
}

export async function updateEquipment(id, data) {
  try {
    const res = await api.put(
      `${API_URL}/api/equipments/${id}`,
      toApiPayload(data)
    );
    return normalizeEquipment(res.data?.data ?? res.data);
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("装備更新失敗");
  }
}

export async function deleteEquipment(id) {
  try {
    const res = await api.delete(`${API_URL}/api/equipments/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("装備削除失敗");
  }
}

export async function createItem(data) {
  try {
    const res = await api.post(`${API_URL}/api/items`, data);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error(error);

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("アイテム作成失敗");
  }
}