import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getExperienceList,
  createExperience,
  updateExperience,
} from '@/api/experience'
import {
  getSkillList,
  createSkill,
  updateSkill,
} from '@/api/skill'
import {
  getSocialMediaList,
  createSocialMedia,
  updateSocialMedia,
} from '@/api/socialMedia'

/** 资料列表及创建/更新协调；各列表只应用最新响应，共享 loading 统计全部在途读取。读取失败保留成功数据，变更失败向页面传播。 */
export const useProfileStore = defineStore('profile', () => {
  const experiences = ref([])
  const skills = ref([])
  const socialMedias = ref([])
  const pendingCount = ref(0)
  const loading = computed(() => pendingCount.value > 0)

  /* ---- Experience ---- */
  let fetchExperiencesToken = 0
  /** @param {number|undefined} type */
  const fetchExperiences = async (type) => {
    const token = ++fetchExperiencesToken
    pendingCount.value++
    try {
      const res = await getExperienceList(type)
      if (token !== fetchExperiencesToken) return
      experiences.value = res.data ?? []
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      pendingCount.value--
    }
  }

  const saveExperience = async (data) => {
    if (data.id) {
      await updateExperience(data)
    } else {
      await createExperience(data)
    }
  }

  /* ---- Skill ---- */
  let fetchSkillsToken = 0
  const fetchSkills = async () => {
    const token = ++fetchSkillsToken
    pendingCount.value++
    try {
      const res = await getSkillList()
      if (token !== fetchSkillsToken) return
      skills.value = (res.data ?? []).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      pendingCount.value--
    }
  }

  const saveSkill = async (data) => {
    if (data.id) {
      await updateSkill(data)
    } else {
      await createSkill(data)
    }
  }

  /* ---- Social Media ---- */
  let fetchSocialMediasToken = 0
  const fetchSocialMedias = async () => {
    const token = ++fetchSocialMediasToken
    pendingCount.value++
    try {
      const res = await getSocialMediaList()
      if (token !== fetchSocialMediasToken) return
      socialMedias.value = (res.data ?? []).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    } catch {
      // The request layer reports failed reads; keep the last successful data.
    } finally {
      pendingCount.value--
    }
  }

  const saveSocialMedia = async (data) => {
    if (data.id) {
      await updateSocialMedia(data)
    } else {
      await createSocialMedia(data)
    }
  }

  return {
    experiences,
    skills,
    socialMedias,
    loading,
    fetchExperiences,
    saveExperience,
    fetchSkills,
    saveSkill,
    fetchSocialMedias,
    saveSocialMedia,
  }
})
