import { Schema, model } from 'mongoose';

const CustomGameSchema = new Schema(
  {
    appid: {
      type: String,
      unique: true,
      required: true,
      index: true,
      match: /^c\d/,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['video_game', 'card_game', 'board_game', 'dlc_expansion'],
      default: 'video_game',
    },
    name: {
      type: String,
      required: true,
    },
    required_age: {
      type: Number,
      default: 0,
    },
    is_free: {
      type: Boolean,
      default: false,
    },

    detailed_description: String,
    about_the_game: String,
    short_description: String,

    supported_languages: String,

    header_image: String,
    capsule_image: String,
    capsule_imagev5: String,
    background: String,
    background_raw: String,

    website: String,

    pc_requirements: {
      minimum: String,
      recommended: String,
    },
    mac_requirements: {
      minimum: String,
      recommended: String,
    },
    linux_requirements: {
      minimum: String,
      recommended: String,
    },

    developers: [String],
    publishers: [String],

    price_overview: {
      currency: String,
      initial: Number,
      final: Number,
      discount_percent: Number,
      initial_formatted: String,
      final_formatted: String,
    },

    platforms: {
      windows: {
        type: Boolean,
        default: true,
      },
      mac: {
        type: Boolean,
        default: false,
      },
      linux: {
        type: Boolean,
        default: false,
      },
    },

    categories: [
      {
        id: Number,
        description: String,
      },
    ],
    genres: [
      {
        id: String,
        description: String,
      },
    ],

    screenshots: [
      {
        id: Number,
        path_thumbnail: String,
        path_full: String,
      },
    ],

    movies: [
      {
        id: {
          type: Number,
          default: 0,
        },
        name: String,
        thumbnail: String,
        embed_html: String,
        video_url: String,
        hls: String,
        hls_h264: String,
        webm: Object,
        mp4: Object,
        highlight: Boolean,
      },
    ],

    dlc: [Number],
    dlc_details: [
      {
        id: Number,
        name: String,
        capsule_image: String,
        header_image: String,
      },
    ],

    recommendations: {
      total: Number,
    },

    release_date: {
      coming_soon: {
        type: Boolean,
        default: false,
      },
      date: String,
    },

    fullgame: {
      appid: Schema.Types.Mixed,
      name: String,
    },

    views: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default model('CustomGame', CustomGameSchema);
