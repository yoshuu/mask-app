<script>
import { computed, ref, onMounted, inject } from "vue";
import L from "leaflet";

let osmMap = {};
// marker 設定
const myIconSettings = {
  iconSize: [25, 40],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
};
const myIcon = {
  gray: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    ...myIconSettings,
  })
}
const osm = {
  // 創立還有定位地圖
  createOsmMap() {
    osmMap = L.map("map", {
      center: [22.98175, 120.2216],
      zoom: 16,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(osmMap);
  },
  // 新增藥局標記點及綁定顯示的彈跳視窗
  addMapMarker(geometry, properties) {
    const icon = myIcon.gray;
    L.marker([geometry.coordinates[1], geometry.coordinates[0]], { icon })
      .addTo(osmMap)
      .bindPopup(
        `
        <h5>${properties.name}</h5>
        口罩剩餘數量: 
        <strong>
          成人: ${properties.mask_adult} / 小孩: ${properties.mask_child}
        </strong>
        <br>
        地址: <a target="_blank" href="https://www.google.com.tw/maps/place/${properties.address}">${properties.address}</a>
        <br>
        電話: ${properties.phone}
        <br>
        <small>最後更新時間: ${properties.updated}</small>
      `
      )
      .openPopup();
  },
  removeMapMarker() {
    osmMap.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        osmMap.removeLayer(layer);
      }
    });
  },
};
export default {
  name: 'Index',
  setup() {
    const axios = inject("axios");
    const data = ref([]);
    const countyName = ref("");
    const countyData = ref([]);
    const townName = ref("");
    const townData = ref([]);
    // 接取遠端資料
    const getJsonData = () => {
      const url =
        "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json";
      axios.get(url).then((res) => {
        data.value = res.data.features;
      });
    };
    // 取得縣市資料
    const getCountyData = () => {
      osm.removeMapMarker();
      countyData.value = data.value.filter((item) => {
        return item.properties.county === countyName.value;
      });
      penTo(countyData.value[0]);
      townName.value = "";
    };
    // 取得地區資料
    const getTownData = () => {
      osm.removeMapMarker();
      townData.value = countyData.value.filter((item) => {
        return item.properties.town === townName.value;
      });
      townData.value.forEach((item) => {
        const { geometry, properties } = item;
        osm.addMapMarker(geometry, properties);
      });
      penTo(townData.value[0]);
    };
    // 地圖移動到點擊的藥局標記點
    const penTo = (item) => {
      const { geometry, properties } = item;
      osmMap.panTo([geometry.coordinates[1], geometry.coordinates[0]]);
      osm.addMapMarker(geometry, properties);
    };
    // 過濾縣市名字
    const county = computed(() => {
      const arr = [];
      data.value.forEach((item) => {
        arr.push(item.properties.county);
      });
      return arr.filter((item, index) => arr.indexOf(item) === index);
    });
    // 過濾地區名字
    const town = computed(() => {
      const arr = [];
      countyData.value.forEach((item) => {
        arr.push(item.properties.town);
      });
      return arr.filter((item, index) => arr.indexOf(item) === index);
    });
    // 最終呈現在左側 list 上的資料
    const displayList = computed(() => {
      if (countyName.value !== "") {
        if (townName.value !== "") {
          return townData.value;
        }
        return countyData.value;
      }
    });
    onMounted(() => {
      getJsonData();
      osm.createOsmMap();
    });
    return {
      countyName,
      townName,
      county,
      town,
      getCountyData,
      getTownData,
      displayList,
      penTo,
    };
  },
};
</script>

<template>
  <div class="grid grid-cols-12 h-screen">
    <div class="col-span-12 sm:col-span-5 xl:col-span-3 
      bg-gray-500 overflow-auto scroll"
      >
      <div class="sticky top-0 shadow-lg p-6 bg-blue-200">
        <div class="flex items-center">
          <label for="county" class="mr-5">縣市</label>
          <select
           @change="getCountyData" id="county"
            class="select" v-model="countyName"
          >
            <option selected disabled value="">-- 請選擇縣市 --</option>
            <option v-for="(item, index) in county" :key="index" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <div class="flex items-center mt-3">
          <label for="area" class="mr-5">地區</label>
          <select
            @change="getTownData" id="area"
            class="select" v-model="townName"
          >
            <option selected disabled value="">-- 請選擇地區 --</option>
            <option v-for="(item, index) in town" :key="index" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <p class="mt-6 text-blue-700 text-lift text-sm">
          點擊就可以移到相對應的標記點!
        </p>
      </div>
      <ul class="text-gray-100">
        <li @click="penTo(item)"
          class="list" 
          v-for="(item, index) in displayList" :key="index">
          <h3 class="text-lg bg-blue-500 inline p-1.5 rounded-sm">{{ item.properties.name }}</h3>
          <div>
            <i class="fas fa-map-marker-alt"></i>
            <span class="ml-2 underline hover:text-blue-500 transition">
              <a target="_blank" 
                :href="`https://www.google.com.tw/maps/place/${item.properties.address}`"
              >
                {{ item.properties.address }}
              </a>
            </span>
          </div>
          <div>
            <i class="fas fa-phone-alt"></i>
            <span class="ml-2">{{ item.properties.phone }}</span>
          </div>
          <div>
            <i class="fas fa-clock"></i>
            <span class="ml-2" :title="item.properties.note">
              {{ item.properties.note }}
            </span>
          </div>
          <div class="flex flex-col xl:flex-row justify-around mt-3 text-center space-y-3 xl:space-y-0">
            <span class="mask-wrap text-md sm:text-sm">
              成人口罩
              <strong class="px-1 text-lg text-blue-500">{{ item.properties.mask_adult }}</strong>
              個
            </span>
            <span class="mask-wrap text-md sm:text-sm">
              小孩口罩
              <strong class="px-1 text-lg text-blue-500">{{ item.properties.mask_child }}</strong>
              個
            </span>
          </div>
        </li>
      </ul>
    </div>
    <div id="map" class="hidden sm:block sm:col-span-7 xl:col-span-9">
    </div>
  </div>
</template>

<style scoped>
.select {
  @apply shadow-sm w-10/12 p-1.5 rounded-md 
  focus:outline-none focus:ring-4 focus:ring-blue-200 transition ease-out;
}

.list {
  @apply shadow-md p-6 space-y-4 cursor-pointer hover:bg-gray-800 transition;
}

.mask-wrap {
  @apply bg-gray-600 p-2 rounded-md shadow-sm text-gray-100;
}

.scroll {
  @apply scrollbar scrollbar-thumb-gray-700 
  scrollbar-track-gray-400
  scrollbar-thumb-rounded-md;
}
</style>
