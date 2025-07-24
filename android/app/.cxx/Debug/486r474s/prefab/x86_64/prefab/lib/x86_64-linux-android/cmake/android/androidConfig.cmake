if(NOT TARGET android::reanimated)
add_library(android::reanimated INTERFACE IMPORTED)
set_target_properties(android::reanimated PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES "/Users/rgarlapallay/Desktop/Workspace/ReactPractice_K/CrusherMate/node_modules/react-native-reanimated/android/build/prefab-headers/reanimated"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET android::worklets)
add_library(android::worklets INTERFACE IMPORTED)
set_target_properties(android::worklets PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES "/Users/rgarlapallay/Desktop/Workspace/ReactPractice_K/CrusherMate/node_modules/react-native-reanimated/android/build/prefab-headers/worklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

